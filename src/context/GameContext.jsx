import { createContext, useState, useCallback, useMemo, useEffect } from 'react'
import useDeck, { getHiLoValue } from '../hooks/useDeck'
import { saveGameState, loadGameState } from '../utils/persistence'

export const GameContext = createContext(null)

export const GameProvider = ({ children }) => {
  const { createDeck } = useDeck()

  const saved = loadGameState()

  const [cards, setCards] = useState(() => saved?.cards ?? createDeck())
  const [playerHand, setPlayerHand] = useState(saved?.playerHand ?? [])
  const [dealerHand, setDealerHand] = useState(saved?.dealerHand ?? [])
  const [bankroll, setBankroll] = useState(saved?.bankroll ?? 1000)
  const [currentBet, setCurrentBet] = useState(saved?.currentBet ?? 0)
  const [runningCount, setRunningCount] = useState(saved?.runningCount ?? 0)
  const [gameStatus, setGameStatus] = useState(saved?.gameStatus ?? 'betting')
  const [resultMessage, setResultMessage] = useState('')

  // True count = running count / decks remaining (design doc §2.1)
  const decksRemaining = Math.max(1, Math.ceil(cards.length / 52))
  const trueCount = decksRemaining > 0
    ? Math.round((runningCount / decksRemaining) * 10) / 10
    : 0

  // Auto-save when in a "safe" state
  useEffect(() => {
    if (gameStatus === 'betting') {
      saveGameState({
        cards, playerHand, dealerHand,
        bankroll, currentBet, runningCount, gameStatus
      })
    }
  }, [cards, playerHand, dealerHand, bankroll, currentBet, runningCount, gameStatus])

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const calculateHandValue = useCallback((hand) => {
    let value = 0
    let aces = 0
    for (const card of hand) {
      if (!card) continue
      value += card.value
      if (card.rank === 'A') aces++
    }
    while (value > 21 && aces > 0) { value -= 10; aces-- }
    return value
  }, [])

  /** Bump the running count for an array of newly-revealed cards. */
  const addToCount = useCallback((revealedCards) => {
    const delta = revealedCards.reduce((sum, c) => sum + getHiLoValue(c.rank), 0)
    if (delta !== 0) setRunningCount(prev => prev + delta)
  }, [])

  /**
   * Draw `n` cards from `shoe`, returning { drawn, remaining }.
   * If the shoe is too small we reshuffle first and reset the count.
   */
  const drawCards = useCallback((shoe, n) => {
    let deck = [...shoe]
    if (deck.length < n) {
      deck = createDeck()
      setRunningCount(0)
    }
    return { drawn: deck.splice(0, n), remaining: deck }
  }, [createDeck])

  /**
   * Simulate the dealer playing out their hand (S17 rules).
   * Returns { finalHand, remaining, revealed } without side-effects.
   */
  const dealerPlayOut = useCallback((shoe, dHand) => {
    const hand = dHand.map(c => ({ ...c, flipped: true }))
    let remaining = [...shoe]
    const revealed = []

    // The hole card is now revealed
    const holeCard = dHand.find(c => !c.flipped)
    if (holeCard) revealed.push(holeCard)

    let value = calculateHandValue(hand)
    while (value < 17) {
      if (remaining.length === 0) break
      const card = { ...remaining.shift(), flipped: true }
      hand.push(card)
      revealed.push(card)
      value = calculateHandValue(hand)
    }
    return { finalHand: hand, remaining, revealed }
  }, [calculateHandValue])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const dealInitialCards = useCallback((betOverride) => {
    const bet = betOverride ?? currentBet
    if (bet <= 0) return
    if (bet > bankroll) {
      setResultMessage('Not enough bankroll!')
      return
    }
    setCurrentBet(bet)

    // Draw 4 cards: P1, D1(up), P2, D2(hole)
    const { drawn, remaining } = drawCards(cards, 4)
    const [p1, d1, p2, d2] = drawn

    const pHand = [
      { ...p1, flipped: true },
      { ...p2, flipped: true }
    ]
    const dHand = [
      { ...d1, flipped: true },   // Dealer up card
      { ...d2, flipped: false }   // Hole card (hidden)
    ]

    // Deduct bet from bankroll
    setBankroll(prev => prev - bet)
    setCards(remaining)
    setPlayerHand(pHand)
    setDealerHand(dHand)
    setResultMessage('')

    // Count the 3 visible cards (player's 2 + dealer's up card)
    addToCount([p1, p2, d1])

    // Check for naturals (blackjack)
    const pVal = calculateHandValue(pHand)
    const dVal = calculateHandValue(dHand)
    const playerBJ = pVal === 21 && pHand.length === 2
    const dealerBJ = dVal === 21 && dHand.length === 2

    if (playerBJ || dealerBJ) {
      // Reveal dealer hole card & count it
      const revealedDHand = dHand.map(c => ({ ...c, flipped: true }))
      setDealerHand(revealedDHand)
      addToCount([d2])

      if (playerBJ && dealerBJ) {
        setBankroll(prev => prev + bet) // push — return bet
        setResultMessage('Both Blackjack — Push!')
        setGameStatus('finished')
      } else if (playerBJ) {
        const payout = bet + bet * 1.5 // 3:2
        setBankroll(prev => prev + payout)
        setResultMessage('Blackjack! You win!')
        setGameStatus('finished')
      } else {
        setResultMessage('Dealer Blackjack. You lose.')
        setGameStatus('finished')
      }
      return
    }

    setGameStatus('playing')
  }, [currentBet, bankroll, cards, drawCards, addToCount, calculateHandValue])

  const playerHit = useCallback(() => {
    if (gameStatus !== 'playing') return

    const { drawn, remaining } = drawCards(cards, 1)
    const card = { ...drawn[0], flipped: true }

    setCards(remaining)
    const newHand = [...playerHand, card]
    setPlayerHand(newHand)
    addToCount([card])

    if (calculateHandValue(newHand) > 21) {
      // Bust — reveal dealer hole card & count it
      const holeCard = dealerHand.find(c => !c.flipped)
      if (holeCard) addToCount([holeCard])
      setDealerHand(prev => prev.map(c => ({ ...c, flipped: true })))
      setResultMessage('Bust! You lose.')
      setGameStatus('finished')
    }
  }, [gameStatus, cards, playerHand, dealerHand, drawCards, addToCount, calculateHandValue])

  const playerStand = useCallback(() => {
    if (gameStatus !== 'playing') return

    const { finalHand, remaining, revealed } = dealerPlayOut(cards, dealerHand)
    addToCount(revealed)

    setDealerHand(finalHand)
    setCards(remaining)

    const pVal = calculateHandValue(playerHand)
    const dVal = calculateHandValue(finalHand)

    if (dVal > 21) {
      setBankroll(prev => prev + currentBet * 2)
      setResultMessage(`Dealer busts with ${dVal}! You win!`)
    } else if (pVal > dVal) {
      setBankroll(prev => prev + currentBet * 2)
      setResultMessage(`You win! ${pVal} vs ${dVal}`)
    } else if (pVal < dVal) {
      setResultMessage(`Dealer wins. ${dVal} vs ${pVal}`)
    } else {
      setBankroll(prev => prev + currentBet) // push
      setResultMessage(`Push at ${pVal}`)
    }
    setGameStatus('finished')
  }, [gameStatus, cards, dealerHand, playerHand, currentBet, dealerPlayOut, addToCount, calculateHandValue])

  const playerDouble = useCallback(() => {
    if (gameStatus !== 'playing') return
    if (currentBet > bankroll) {
      setResultMessage('Not enough bankroll to double!')
      return
    }

    // Double the bet and draw exactly one card
    const doubleBet = currentBet * 2
    setBankroll(prev => prev - currentBet) // deduct the extra bet
    setCurrentBet(doubleBet)

    const { drawn, remaining } = drawCards(cards, 1)
    const card = { ...drawn[0], flipped: true }
    const newHand = [...playerHand, card]
    setPlayerHand(newHand)
    addToCount([card])

    const pVal = calculateHandValue(newHand)

    if (pVal > 21) {
      // Bust on double
      const holeCard = dealerHand.find(c => !c.flipped)
      if (holeCard) addToCount([holeCard])
      setDealerHand(prev => prev.map(c => ({ ...c, flipped: true })))
      setCards(remaining)
      setResultMessage('Bust on double! You lose.')
      setGameStatus('finished')
      return
    }

    // Dealer plays out
    const { finalHand, remaining: rem2, revealed } = dealerPlayOut(remaining, dealerHand)
    addToCount(revealed)
    setDealerHand(finalHand)
    setCards(rem2)

    const dVal = calculateHandValue(finalHand)

    if (dVal > 21) {
      setBankroll(prev => prev + doubleBet * 2)
      setResultMessage(`Dealer busts! Double down wins! +$${doubleBet}`)
    } else if (pVal > dVal) {
      setBankroll(prev => prev + doubleBet * 2)
      setResultMessage(`Double down wins! ${pVal} vs ${dVal}`)
    } else if (pVal < dVal) {
      setResultMessage(`Dealer wins on double. ${dVal} vs ${pVal}`)
    } else {
      setBankroll(prev => prev + doubleBet)
      setResultMessage(`Push at ${pVal} (double returned)`)
    }
    setGameStatus('finished')
  }, [gameStatus, currentBet, bankroll, cards, playerHand, dealerHand, drawCards, addToCount, calculateHandValue, dealerPlayOut])

  /** Start a new hand — keeps bankroll and count, reshuffles if shoe is low. */
  const newHand = useCallback(() => {
    let nextCards = cards
    let nextCount = runningCount
    // Reshuffle when ~1 deck remains (design doc §6.1)
    if (cards.length < 20) {
      nextCards = createDeck()
      nextCount = 0
      setRunningCount(0)
    }
    setCards(nextCards)
    setPlayerHand([])
    setDealerHand([])
    setGameStatus('betting')
    setCurrentBet(0)
    setResultMessage('')
  }, [cards, runningCount, createDeck])

  /** Full reset — new shoe, bankroll back to $1000. */
  const resetGame = useCallback(() => {
    setCards(createDeck())
    setPlayerHand([])
    setDealerHand([])
    setBankroll(1000)
    setCurrentBet(0)
    setRunningCount(0)
    setGameStatus('betting')
    setResultMessage('')
  }, [createDeck])

  /** Restore a previously saved state (used by load-game feature). */
  const loadSavedState = useCallback((state) => {
    if (!state) return
    setCards(state.cards ?? createDeck())
    setPlayerHand(state.playerHand ?? [])
    setDealerHand(state.dealerHand ?? [])
    setBankroll(state.bankroll ?? 1000)
    setCurrentBet(state.currentBet ?? 0)
    setRunningCount(state.runningCount ?? 0)
    setGameStatus(state.gameStatus ?? 'betting')
    setResultMessage('')
  }, [createDeck])

  // ---------------------------------------------------------------------------
  // Theme (matches design doc §3.1)
  // ---------------------------------------------------------------------------
  const theme = useMemo(() => ({
    cardColor: '#ffffff',
    cardBorder: '#333333',
    cardText: '#000000',
    cardBack: '#1a4d2e',
  }), [])

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  const value = useMemo(() => ({
    // State
    cards, playerHand, dealerHand,
    bankroll, currentBet, runningCount, trueCount,
    gameStatus, resultMessage,
    theme,
    // Setters (only expose what components need)
    setCurrentBet,
    // Actions
    dealInitialCards, playerHit, playerStand, playerDouble,
    newHand, resetGame, loadSavedState,
    // Helpers
    calculateHandValue,
  }), [
    cards, playerHand, dealerHand,
    bankroll, currentBet, runningCount, trueCount,
    gameStatus, resultMessage, theme,
    dealInitialCards, playerHit, playerStand, playerDouble,
    newHand, resetGame, loadSavedState, calculateHandValue,
  ])

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}
