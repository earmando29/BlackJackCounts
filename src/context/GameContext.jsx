import { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import useDeck from '../hooks/useDeck'
import { saveGameState, loadGameState, saveSession } from '../utils/persistence'
import {
  calculateHandValue, getCountDelta, dealerPlayOut, SPEED_MAP,
} from '../utils/gameLogic'
import { getRecommendation } from '../utils/strategy'

export const GameContext = createContext(null)

const TOTAL_CARDS = 6 * 52 // 312 cards in a 6-deck shoe

const emptyHand = (spotIndex = 0) => ({
  cards: [], bet: 0, originalBet: 0, result: '',
  spotIndex, isSplitHand: false,
})
const makeHands = () => [emptyHand(0), emptyHand(1), emptyHand(2)]
const MAX_SPLIT_HANDS = 5

export const GameProvider = ({ children }) => {
  const { createDeck } = useDeck()
  const saved = loadGameState()
  const dealIdRef = useRef(0)

  // --- Core state ---
  const [cards, setCards] = useState(() => saved?.cards ?? createDeck())
  const [hands, setHands] = useState(() => saved?.hands ?? makeHands())
  const [dealerHand, setDealerHand] = useState(saved?.dealerHand ?? [])
  const [bankroll, setBankroll] = useState(saved?.bankroll ?? 1000)
  const [runningCount, setRunningCount] = useState(saved?.runningCount ?? 0)
  const [gameStatus, setGameStatus] = useState(saved?.gameStatus ?? 'betting')
  const [activeHandIndex, setActiveHandIndex] = useState(0)
  const [totalBuyIn, setTotalBuyIn] = useState(saved?.totalBuyIn ?? 1000)

  // --- Round tracking ---
  const [bankrollAtDeal, setBankrollAtDeal] = useState(0)
  const [handHistory, setHandHistory] = useState(saved?.handHistory ?? [])
  const [reviewingRound, setReviewingRound] = useState(null)
  const [sessionEV, setSessionEV] = useState(saved?.sessionEV ?? 0)

  // --- Settings ---
  const [numSpots, setNumSpots] = useState(saved?.numSpots ?? 1)
  const [selectedSpot, setSelectedSpot] = useState(0)
  const [dealSpeed, setDealSpeed] = useState(saved?.dealSpeed ?? 3)
  const [showCounts, setShowCounts] = useState(false)
  const [showAdvisor, setShowAdvisor] = useState(false)

  // --- Derived ---
  const decksRemaining = Math.max(1, Math.ceil(cards.length / 52))
  const trueCount = Math.round((runningCount / decksRemaining) * 10) / 10
  const speedMs = SPEED_MAP[dealSpeed] ?? 280
  const roundNet = gameStatus === 'finished' ? bankroll - bankrollAtDeal : null

  // Discard count = total cards - shoe - in-play cards
  const inPlayCount = hands.reduce((n, h) => n + h.cards.length, 0) + dealerHand.length
  const discardCount = Math.max(0, TOTAL_CARDS - cards.length - inPlayCount)

  // Clear bets beyond numSpots when spots shrink
  useEffect(() => {
    if (gameStatus === 'betting') {
      setHands(prev => prev.map(h =>
        h.spotIndex >= numSpots ? { ...h, bet: 0 } : h
      ))
      if (selectedSpot >= numSpots) setSelectedSpot(0)
    }
  }, [numSpots]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save on idle
  useEffect(() => {
    if (gameStatus === 'betting') {
      saveGameState({
        cards, hands, dealerHand, bankroll,
        runningCount, gameStatus, numSpots, dealSpeed, totalBuyIn, handHistory, sessionEV,
      })
    }
  }, [cards, hands, dealerHand, bankroll, runningCount, gameStatus, numSpots, dealSpeed, totalBuyIn, handHistory, sessionEV])

  // ---- helpers ----
  const addToCount = useCallback((revealed) => {
    if (!revealed || revealed.length === 0) return
    const valid = revealed.filter(c => c?.rank)
    if (valid.length === 0) return
    const delta = getCountDelta(valid)
    setRunningCount(prev => {
      const next = prev + delta
      console.log(`[Count] ${valid.map(c => c.rank).join(',')} → Δ${delta >= 0 ? '+' : ''}${delta}  RC: ${prev}→${next}`)
      return next
    })
  }, [])

  const ensureShoe = useCallback((shoe, needed) => {
    if (shoe.length >= needed) return [...shoe]
    console.log('[Shoe] Reshuffling')
    setRunningCount(0)
    return createDeck()
  }, [createDeck])

  // ---- Betting ----
  const addChip = useCallback((amount) => {
    if (gameStatus !== 'betting' || selectedSpot >= numSpots) return
    setHands(prev => prev.map((h, i) =>
      i === selectedSpot
        ? { ...h, bet: h.bet + amount, originalBet: h.bet + amount }
        : h
    ))
  }, [gameStatus, selectedSpot, numSpots])

  const clearBet = useCallback((spotIdx) => {
    if (gameStatus !== 'betting') return
    setHands(prev => prev.map((h, i) =>
      i === spotIdx ? { ...h, bet: 0, originalBet: 0 } : h
    ))
  }, [gameStatus])

  /** Copy the selected spot's bet to all active spots. */
  const betAllSpots = useCallback(() => {
    if (gameStatus !== 'betting') return
    const sourceBet = hands[selectedSpot]?.bet ?? 0
    if (sourceBet <= 0) return
    setHands(prev => prev.map((h, i) =>
      i < numSpots ? { ...h, bet: sourceBet, originalBet: sourceBet } : h
    ))
  }, [gameStatus, hands, selectedSpot, numSpots])

  const rebuy = useCallback((amount = 1000) => {
    if (gameStatus !== 'betting') return
    setBankroll(prev => prev + amount)
    setTotalBuyIn(prev => prev + amount)
  }, [gameStatus])

  // ---- Dealer turn ----
  const performDealerTurn = useCallback((curHands, curShoe, curDealer) => {
    const anyStood = curHands.some(h => h.bet > 0 && h.result === 'stood')

    if (!anyStood) {
      const hole = curDealer.find(c => !c.flipped)
      if (hole) addToCount([hole])
      setDealerHand(curDealer.map(c => ({ ...c, flipped: true })))
      setHands(curHands)
      setGameStatus('finished')
      return
    }

    const { finalHand, remaining, revealed } = dealerPlayOut(curShoe, curDealer)
    addToCount(revealed)
    setDealerHand(finalHand)
    setCards(remaining)

    const dVal = calculateHandValue(finalHand)
    const dBust = dVal > 21
    let payout = 0
    const resolved = curHands.map(h => {
      if (h.bet === 0 || h.result !== 'stood') return h
      const pVal = calculateHandValue(h.cards)
      if (dBust) { payout += h.bet * 2; return { ...h, result: `Win! ${pVal} vs Bust` } }
      if (pVal > dVal) { payout += h.bet * 2; return { ...h, result: `Win! ${pVal} vs ${dVal}` } }
      if (pVal < dVal) { return { ...h, result: `Lose ${pVal} vs ${dVal}` } }
      payout += h.bet; return { ...h, result: `Push ${pVal}` }
    })

    if (payout > 0) setBankroll(prev => prev + payout)
    setHands(resolved)
    setGameStatus('finished')
  }, [addToCount])

  const advanceToNextHand = useCallback((curHands, curShoe, curDealer) => {
    const nextIdx = curHands.findIndex((h, i) =>
      i > activeHandIndex && h.bet > 0 && h.result === ''
    )
    if (nextIdx >= 0) {
      setHands(curHands)
      setActiveHandIndex(nextIdx)
      return
    }
    performDealerTurn(curHands, curShoe, curDealer)
  }, [activeHandIndex, performDealerTurn])

  // ---- Deal ----
  const dealInitialCards = useCallback(() => {
    const activeSlots = hands.slice(0, numSpots).filter(h => h.bet > 0)
    if (activeSlots.length === 0) return
    const totalBets = activeSlots.reduce((s, h) => s + h.bet, 0)
    if (totalBets > bankroll) return

    // Snapshot bankroll BEFORE deductions for round-net calc
    setBankrollAtDeal(bankroll)
    setBankroll(prev => prev - totalBets)
    setGameStatus('dealing')

    const need = (activeSlots.length + 1) * 2
    const shoe = ensureShoe(cards, need + 20)

    const newHands = hands.slice(0, numSpots).map((h, i) => ({
      ...emptyHand(i), bet: h.bet, originalBet: h.bet,
    }))
    const newDealer = []
    let order = 0

    for (let i = 0; i < numSpots; i++)
      if (newHands[i].bet > 0)
        newHands[i].cards.push({ ...shoe.shift(), flipped: true, dealOrder: order++ })
    newDealer.push({ ...shoe.shift(), flipped: true, dealOrder: order++ })

    for (let i = 0; i < numSpots; i++)
      if (newHands[i].bet > 0)
        newHands[i].cards.push({ ...shoe.shift(), flipped: true, dealOrder: order++ })
    newDealer.push({ ...shoe.shift(), flipped: false, dealOrder: order++ })

    setCards(shoe)
    setHands(newHands)
    setDealerHand(newDealer)

    const visible = []
    newHands.forEach(h => h.cards.forEach(c => visible.push(c)))
    visible.push(newDealer[0])
    addToCount(visible)

    const animMs = order * speedMs + 500
    const id = ++dealIdRef.current

    setTimeout(() => {
      if (dealIdRef.current !== id) return
      const dVal = calculateHandValue(newDealer)
      const dealerBJ = dVal === 21 && newDealer.length === 2
      const updated = newHands.map(h => ({ ...h }))
      let pay = 0

      if (dealerBJ) {
        const holeCard = newDealer.find(c => !c.flipped)
        if (holeCard) addToCount([holeCard])
        setDealerHand(newDealer.map(c => ({ ...c, flipped: true, peeling: !c.flipped })))
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].bet <= 0) continue
          const pVal = calculateHandValue(updated[i].cards)
          const pBJ = pVal === 21 && updated[i].cards.length === 2
          if (pBJ) { updated[i].result = `Push ${pVal}`; pay += updated[i].bet }
          else updated[i].result = `Dealer BJ — Lose ${pVal} vs 21`
        }
        if (pay > 0) setBankroll(prev => prev + pay)
        setHands(updated)
        setGameStatus('finished')
        return
      }

      let allDone = true
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].bet <= 0) continue
        const pVal = calculateHandValue(updated[i].cards)
        if (pVal === 21 && updated[i].cards.length === 2) {
          pay += updated[i].bet + updated[i].bet * 1.5
          updated[i].result = 'Blackjack! 🃏'
        } else { allDone = false }
      }
      if (pay > 0) setBankroll(prev => prev + pay)

      if (allDone) {
        const holeCard = newDealer.find(c => !c.flipped)
        if (holeCard) addToCount([holeCard])
        setDealerHand(newDealer.map(c => ({ ...c, flipped: true })))
        setHands(updated)
        setGameStatus('finished')
        return
      }

      const first = updated.findIndex(h => h.bet > 0 && !h.result)
      setActiveHandIndex(first >= 0 ? first : 0)
      setHands(updated)
      setGameStatus('playing')
    }, animMs)
  }, [hands, numSpots, bankroll, cards, ensureShoe, speedMs, addToCount])

  // ---- Player actions ----
  const playerHit = useCallback(() => {
    if (gameStatus !== 'playing') return
    const idx = activeHandIndex
    const shoe = ensureShoe(cards, 1)
    const card = { ...shoe.shift(), flipped: true, dealOrder: 0 }
    setCards(shoe)
    addToCount([card])

    const newCards = [...hands[idx].cards, card]
    const val = calculateHandValue(newCards)
    const busted = val > 21
    const updated = hands.map((h, i) =>
      i === idx ? { ...h, cards: newCards, result: busted ? `Bust! (${val})` : '' } : h
    )
    if (busted) advanceToNextHand(updated, shoe, dealerHand)
    else setHands(updated)
  }, [gameStatus, activeHandIndex, cards, hands, dealerHand, ensureShoe, addToCount, advanceToNextHand])

  const playerStand = useCallback(() => {
    if (gameStatus !== 'playing') return
    const updated = hands.map((h, i) =>
      i === activeHandIndex ? { ...h, result: 'stood' } : h
    )
    advanceToNextHand(updated, cards, dealerHand)
  }, [gameStatus, activeHandIndex, hands, cards, dealerHand, advanceToNextHand])

  const playerDouble = useCallback(() => {
    if (gameStatus !== 'playing') return
    const hand = hands[activeHandIndex]
    if (hand.bet > bankroll) return

    setBankroll(prev => prev - hand.bet)
    const shoe = ensureShoe(cards, 1)
    const card = { ...shoe.shift(), flipped: true, dealOrder: 0 }
    setCards(shoe)
    addToCount([card])

    const newCards = [...hand.cards, card]
    const val = calculateHandValue(newCards)
    const busted = val > 21
    const updated = hands.map((h, i) =>
      i === activeHandIndex
        ? { ...h, cards: newCards, bet: h.bet * 2, result: busted ? `Bust! (${val})` : 'stood' }
        : h
    )
    advanceToNextHand(updated, shoe, dealerHand)
  }, [gameStatus, activeHandIndex, hands, bankroll, cards, dealerHand, ensureShoe, addToCount, advanceToNextHand])

  // ---- Split ----
  const playerSplit = useCallback(() => {
    if (gameStatus !== 'playing') return
    const hand = hands[activeHandIndex]
    if (hand.cards.length !== 2) return
    if (hand.cards[0].value !== hand.cards[1].value) return

    const spotCount = hands.filter(h => h.spotIndex === hand.spotIndex).length
    if (spotCount >= MAX_SPLIT_HANDS) return

    const bet = hand.originalBet
    if (bet > bankroll) return
    const isAces = hand.cards[0].rank === 'A'

    setBankroll(prev => prev - bet)
    const shoe = ensureShoe(cards, 2)
    const card1 = { ...shoe.shift(), flipped: true, dealOrder: 0 }
    const card2 = { ...shoe.shift(), flipped: true, dealOrder: 0 }
    setCards(shoe)
    addToCount([card1, card2])

    const hand1 = { ...hand, cards: [hand.cards[0], card1], bet, result: isAces ? 'stood' : '' }
    const hand2 = {
      cards: [hand.cards[1], card2], bet, originalBet: bet,
      result: isAces ? 'stood' : '', spotIndex: hand.spotIndex, isSplitHand: true,
    }

    const updated = [...hands]
    updated[activeHandIndex] = hand1
    updated.splice(activeHandIndex + 1, 0, hand2)

    if (isAces) advanceToNextHand(updated, shoe, dealerHand)
    else setHands(updated)
  }, [gameStatus, activeHandIndex, hands, bankroll, cards, dealerHand, ensureShoe, addToCount, advanceToNextHand])

  // ---- New hand / Reset ----
  const newHand = useCallback(() => {
    dealIdRef.current++

    // Push completed round to history + accumulate EV
    if (dealerHand.length > 0) {
      const dealerUp = dealerHand[0]
      let roundEV = 0
      const activeHands = hands.filter(h => h.bet > 0)
      for (const h of activeHands) {
        const initCards = h.cards.slice(0, 2)
        if (initCards.length < 2 || !dealerUp) continue
        const rec = getRecommendation(initCards, dealerUp, 0, {
          canDouble: true, canSplit: false, bet: h.bet,
        })
        if (rec) roundEV += rec.ev.dollar
      }
      setSessionEV(prev => prev + roundEV)
      setHandHistory(prev => [...prev, {
        handNumber: prev.length + 1,
        dealerHand: dealerHand.map(c => ({ ...c, flipped: true })),
        playerHands: activeHands.map(h => ({ ...h })),
        roundNet: bankroll - bankrollAtDeal,
        roundEV,
        runningCount,
        timestamp: new Date().toISOString(),
      }])
    }

    if (cards.length < 60) { setCards(createDeck()); setRunningCount(0) }

    const spotBets = new Map()
    for (const h of hands) {
      if (!spotBets.has(h.spotIndex)) spotBets.set(h.spotIndex, h.originalBet ?? 0)
    }
    const rebuilt = Array.from({ length: 3 }, (_, i) => ({
      ...emptyHand(i),
      bet: spotBets.get(i) ?? 0,
      originalBet: spotBets.get(i) ?? 0,
    }))

    setHands(rebuilt)
    setDealerHand([])
    setGameStatus('betting')
    setActiveHandIndex(0)
    setReviewingRound(null)
  }, [cards, hands, dealerHand, bankroll, bankrollAtDeal, runningCount, createDeck])

  const resetGame = useCallback(() => {
    dealIdRef.current++
    setCards(createDeck())
    setHands(makeHands())
    setDealerHand([])
    setBankroll(1000)
    setTotalBuyIn(1000)
    setRunningCount(0)
    setGameStatus('betting')
    setActiveHandIndex(0)
    setSelectedSpot(0)
    setHandHistory([])
    setReviewingRound(null)
    setBankrollAtDeal(0)
    setSessionEV(0)
  }, [createDeck])

  // ---- Save / History ----
  const saveGame = useCallback(() => {
    saveSession({
      cards, hands, dealerHand, bankroll,
      runningCount, gameStatus, numSpots, dealSpeed, totalBuyIn, handHistory, sessionEV,
    })
  }, [cards, hands, dealerHand, bankroll, runningCount, gameStatus, numSpots, dealSpeed, totalBuyIn, handHistory, sessionEV])

  const viewHistoryRound = useCallback((index) => {
    if (index >= 0 && index < handHistory.length) {
      setReviewingRound(handHistory[index])
    }
  }, [handHistory])

  const exitHistoryView = useCallback(() => setReviewingRound(null), [])

  const loadSavedState = useCallback((state) => {
    if (!state) return
    dealIdRef.current++
    setCards(state.cards ?? createDeck())
    setHands(state.hands ?? makeHands())
    setDealerHand(state.dealerHand ?? [])
    setBankroll(state.bankroll ?? 1000)
    setTotalBuyIn(state.totalBuyIn ?? state.bankroll ?? 1000)
    setRunningCount(state.runningCount ?? 0)
    setGameStatus(state.gameStatus ?? 'betting')
    setHandHistory(state.handHistory ?? [])
    setSessionEV(state.sessionEV ?? 0)
    setActiveHandIndex(0)
    setSelectedSpot(0)
    setReviewingRound(null)
    if (state.numSpots) setNumSpots(state.numSpots)
    if (state.dealSpeed) setDealSpeed(state.dealSpeed)
  }, [createDeck])

  // --- Theme ---
  const theme = useMemo(() => ({
    cardColor: '#ffffff', cardBorder: '#333333',
    cardText: '#000000', cardBack: '#1a4d2e',
  }), [])

  const value = useMemo(() => ({
    cards, hands, dealerHand, bankroll, totalBuyIn,
    runningCount, trueCount, gameStatus,
    activeHandIndex, numSpots, selectedSpot,
    dealSpeed, showCounts, speedMs, theme,
    roundNet, discardCount, handHistory, reviewingRound, sessionEV,
    setNumSpots, setSelectedSpot, setDealSpeed, setShowCounts,
    showAdvisor, setShowAdvisor,
    addChip, clearBet, betAllSpots, dealInitialCards, rebuy,
    playerHit, playerStand, playerDouble, playerSplit,
    newHand, resetGame, loadSavedState, saveGame,
    viewHistoryRound, exitHistoryView,
    calculateHandValue,
  }), [
    cards, hands, dealerHand, bankroll, totalBuyIn,
    runningCount, trueCount, gameStatus,
    activeHandIndex, numSpots, selectedSpot,
    dealSpeed, showCounts, speedMs, theme,
    roundNet, discardCount, handHistory, reviewingRound, sessionEV,
    showAdvisor, setShowAdvisor,
    addChip, clearBet, betAllSpots, dealInitialCards, rebuy,
    playerHit, playerStand, playerDouble, playerSplit,
    newHand, resetGame, loadSavedState, saveGame,
    viewHistoryRound, exitHistoryView,
  ])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
