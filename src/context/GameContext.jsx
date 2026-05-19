import { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import useDeck from '../hooks/useDeck'
import { saveGameState, loadGameState } from '../utils/persistence'
import {
  calculateHandValue, getCountDelta, dealerPlayOut, SPEED_MAP,
} from '../utils/gameLogic'

export const GameContext = createContext(null)

const emptyHand = () => ({ cards: [], bet: 0, result: '' })
const makeHands = () => [emptyHand(), emptyHand(), emptyHand()]

export const GameProvider = ({ children }) => {
  const { createDeck } = useDeck()
  const saved = loadGameState()
  const dealIdRef = useRef(0) // guard stale timeouts on reset

  // --- Core state ---
  const [cards, setCards] = useState(() => saved?.cards ?? createDeck())
  const [hands, setHands] = useState(() => saved?.hands ?? makeHands())
  const [dealerHand, setDealerHand] = useState(saved?.dealerHand ?? [])
  const [bankroll, setBankroll] = useState(saved?.bankroll ?? 1000)
  const [runningCount, setRunningCount] = useState(saved?.runningCount ?? 0)
  const [gameStatus, setGameStatus] = useState(saved?.gameStatus ?? 'betting')
  const [activeHandIndex, setActiveHandIndex] = useState(0)

  // --- Settings ---
  const [numSpots, setNumSpots] = useState(saved?.numSpots ?? 1)
  const [selectedSpot, setSelectedSpot] = useState(0)
  const [dealSpeed, setDealSpeed] = useState(saved?.dealSpeed ?? 3)
  const [showCounts, setShowCounts] = useState(false)

  // --- Derived ---
  const decksRemaining = Math.max(1, Math.ceil(cards.length / 52))
  const trueCount = Math.round((runningCount / decksRemaining) * 10) / 10
  const speedMs = SPEED_MAP[dealSpeed] ?? 280

  // Clear bets beyond numSpots when spots shrink
  useEffect(() => {
    if (gameStatus === 'betting') {
      setHands(prev => prev.map((h, i) => i >= numSpots ? { ...h, bet: 0 } : h))
      if (selectedSpot >= numSpots) setSelectedSpot(0)
    }
  }, [numSpots]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save on idle states
  useEffect(() => {
    if (gameStatus === 'betting') {
      saveGameState({
        cards, hands, dealerHand, bankroll,
        runningCount, gameStatus, numSpots, dealSpeed,
      })
    }
  }, [cards, hands, dealerHand, bankroll, runningCount, gameStatus, numSpots, dealSpeed])

  // ---- helpers ----
  const addToCount = useCallback((revealed) => {
    const delta = getCountDelta(revealed)
    if (delta !== 0) setRunningCount(prev => prev + delta)
  }, [])

  const ensureShoe = useCallback((shoe, needed) => {
    if (shoe.length >= needed) return [...shoe]
    setRunningCount(0)
    return createDeck()
  }, [createDeck])

  // ---- Betting ----
  const addChip = useCallback((amount) => {
    if (gameStatus !== 'betting' || selectedSpot >= numSpots) return
    setHands(prev => prev.map((h, i) =>
      i === selectedSpot ? { ...h, bet: h.bet + amount } : h
    ))
  }, [gameStatus, selectedSpot, numSpots])

  const clearBet = useCallback((spotIdx) => {
    if (gameStatus !== 'betting') return
    setHands(prev => prev.map((h, i) =>
      i === spotIdx ? { ...h, bet: 0 } : h
    ))
  }, [gameStatus])

  // ---- Dealer turn (called when all player hands resolved) ----
  const performDealerTurn = useCallback((curHands, curShoe, curDealer) => {
    const anyStood = curHands.some((h, i) => i < numSpots && h.result === 'stood')

    if (!anyStood) {
      // Everyone busted — just reveal hole card
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
    let payout = 0
    const resolved = curHands.map((h, i) => {
      if (i >= numSpots || h.bet === 0 || h.result !== 'stood') return h
      const pVal = calculateHandValue(h.cards)
      if (dVal > 21 || pVal > dVal) { payout += h.bet * 2; return { ...h, result: 'Win!' } }
      if (pVal < dVal) return { ...h, result: 'Lose' }
      payout += h.bet; return { ...h, result: 'Push' }
    })

    if (payout > 0) setBankroll(prev => prev + payout)
    setHands(resolved)
    setGameStatus('finished')
  }, [numSpots, addToCount])

  // Move to next unplayed hand, or trigger dealer
  const advanceToNextHand = useCallback((curHands, curShoe, curDealer) => {
    const nextIdx = curHands.findIndex((h, i) =>
      i > activeHandIndex && i < numSpots && h.bet > 0 && h.result === ''
    )
    if (nextIdx >= 0) {
      setHands(curHands)
      setActiveHandIndex(nextIdx)
      return
    }
    performDealerTurn(curHands, curShoe, curDealer)
  }, [activeHandIndex, numSpots, performDealerTurn])

  // ---- Deal initial cards ----
  const dealInitialCards = useCallback(() => {
    const activeSlots = hands.slice(0, numSpots).filter(h => h.bet > 0)
    if (activeSlots.length === 0) return

    const totalBets = activeSlots.reduce((s, h) => s + h.bet, 0)
    if (totalBets > bankroll) return

    setBankroll(prev => prev - totalBets)
    setGameStatus('dealing')

    const need = (activeSlots.length + 1) * 2
    const shoe = ensureShoe(cards, need + 20)

    const newHands = hands.map(h => ({ ...h, cards: [], result: '' }))
    const newDealer = []
    let order = 0

    // Round 1: each active hand, then dealer up-card
    for (let i = 0; i < numSpots; i++)
      if (newHands[i].bet > 0)
        newHands[i].cards.push({ ...shoe.shift(), flipped: true, dealOrder: order++ })
    newDealer.push({ ...shoe.shift(), flipped: true, dealOrder: order++ })

    // Round 2: each active hand, then dealer hole-card
    for (let i = 0; i < numSpots; i++)
      if (newHands[i].bet > 0)
        newHands[i].cards.push({ ...shoe.shift(), flipped: true, dealOrder: order++ })
    newDealer.push({ ...shoe.shift(), flipped: false, dealOrder: order++ })

    setCards(shoe)
    setHands(newHands)
    setDealerHand(newDealer)

    // Count visible cards (player cards + dealer up-card)
    const visible = []
    newHands.forEach(h => h.cards.forEach(c => visible.push(c)))
    visible.push(newDealer[0])
    addToCount(visible)

    // ---- After deal animation: check blackjacks ----
    const animMs = order * speedMs + 500
    const id = ++dealIdRef.current

    setTimeout(() => {
      if (dealIdRef.current !== id) return // stale (user reset mid-deal)

      const dVal = calculateHandValue(newDealer)
      const dealerBJ = dVal === 21 && newDealer.length === 2
      const updated = newHands.map(h => ({ ...h }))
      let pay = 0

      if (dealerBJ) {
        addToCount([newDealer.find(c => !c.flipped)])
        setDealerHand(newDealer.map(c => ({ ...c, flipped: true, peeling: !c.flipped })))
        for (let i = 0; i < numSpots; i++) {
          if (updated[i].bet <= 0) continue
          const pBJ = calculateHandValue(updated[i].cards) === 21 && updated[i].cards.length === 2
          if (pBJ) { updated[i].result = 'Push'; pay += updated[i].bet }
          else updated[i].result = 'Dealer BJ'
        }
        if (pay > 0) setBankroll(prev => prev + pay)
        setHands(updated)
        setGameStatus('finished')
        return
      }

      // Player blackjacks
      let allDone = true
      for (let i = 0; i < numSpots; i++) {
        if (updated[i].bet <= 0) continue
        if (calculateHandValue(updated[i].cards) === 21 && updated[i].cards.length === 2) {
          pay += updated[i].bet + updated[i].bet * 1.5
          updated[i].result = 'Blackjack!'
        } else { allDone = false }
      }
      if (pay > 0) setBankroll(prev => prev + pay)

      if (allDone) {
        addToCount([newDealer.find(c => !c.flipped)])
        setDealerHand(newDealer.map(c => ({ ...c, flipped: true })))
        setHands(updated)
        setGameStatus('finished')
        return
      }

      const first = updated.findIndex((h, i) => i < numSpots && h.bet > 0 && !h.result)
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
    const card = { ...shoe.shift(), flipped: true }
    setCards(shoe)
    addToCount([card])

    const newCards = [...hands[idx].cards, card]
    const busted = calculateHandValue(newCards) > 21
    const updated = hands.map((h, i) =>
      i === idx ? { ...h, cards: newCards, result: busted ? 'Bust' : '' } : h
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
    const card = { ...shoe.shift(), flipped: true }
    setCards(shoe)
    addToCount([card])

    const newCards = [...hand.cards, card]
    const busted = calculateHandValue(newCards) > 21
    const updated = hands.map((h, i) =>
      i === activeHandIndex
        ? { ...h, cards: newCards, bet: h.bet * 2, result: busted ? 'Bust' : 'stood' }
        : h
    )
    advanceToNextHand(updated, shoe, dealerHand)
  }, [gameStatus, activeHandIndex, hands, bankroll, cards, dealerHand, ensureShoe, addToCount, advanceToNextHand])

  // ---- New hand / Reset ----
  const newHand = useCallback(() => {
    dealIdRef.current++
    if (cards.length < 60) { setCards(createDeck()); setRunningCount(0) }
    setHands(prev => prev.map(h => ({ ...h, cards: [], result: '' })))
    setDealerHand([])
    setGameStatus('betting')
    setActiveHandIndex(0)
  }, [cards, createDeck])

  const resetGame = useCallback(() => {
    dealIdRef.current++
    setCards(createDeck())
    setHands(makeHands())
    setDealerHand([])
    setBankroll(1000)
    setRunningCount(0)
    setGameStatus('betting')
    setActiveHandIndex(0)
    setSelectedSpot(0)
  }, [createDeck])

  const loadSavedState = useCallback((state) => {
    if (!state) return
    dealIdRef.current++
    setCards(state.cards ?? createDeck())
    setHands(state.hands ?? makeHands())
    setDealerHand(state.dealerHand ?? [])
    setBankroll(state.bankroll ?? 1000)
    setRunningCount(state.runningCount ?? 0)
    setGameStatus(state.gameStatus ?? 'betting')
    setActiveHandIndex(0)
    setSelectedSpot(0)
    if (state.numSpots) setNumSpots(state.numSpots)
    if (state.dealSpeed) setDealSpeed(state.dealSpeed)
  }, [createDeck])

  // --- Theme ---
  const theme = useMemo(() => ({
    cardColor: '#ffffff', cardBorder: '#333333',
    cardText: '#000000', cardBack: '#1a4d2e',
  }), [])

  const value = useMemo(() => ({
    cards, hands, dealerHand, bankroll,
    runningCount, trueCount, gameStatus,
    activeHandIndex, numSpots, selectedSpot,
    dealSpeed, showCounts, speedMs, theme,
    setNumSpots, setSelectedSpot, setDealSpeed, setShowCounts,
    addChip, clearBet, dealInitialCards,
    playerHit, playerStand, playerDouble,
    newHand, resetGame, loadSavedState,
    calculateHandValue,
  }), [
    cards, hands, dealerHand, bankroll,
    runningCount, trueCount, gameStatus,
    activeHandIndex, numSpots, selectedSpot,
    dealSpeed, showCounts, speedMs, theme,
    addChip, clearBet, dealInitialCards,
    playerHit, playerStand, playerDouble,
    newHand, resetGame, loadSavedState,
  ])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
