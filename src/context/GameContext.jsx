import { createContext, useState, useCallback, useMemo, useEffect } from 'react'
import useDeck from '../hooks/useDeck'
import { saveGameState, loadGameState } from '../utils/persistence'

export const GameContext = createContext(null)

export const GameProvider = ({ children }) => {
  const { createDeck, drawCard, resetDeck } = useDeck()

  // Load saved game state on initialization
  const savedState = loadGameState()
  
  const initialDeck = savedState?.deck || createDeck()
  const [deck, setDeck] = useState(initialDeck)
  const [playerHand, setPlayerHand] = useState(savedState?.playerHand || [])
  const [dealerHand, setDealerHand] = useState(savedState?.dealerHand || [])
  const [gameStatus, setGameStatus] = useState(savedState?.gameStatus || 'betting')
  const [currentBet, setCurrentBet] = useState(savedState?.currentBet || 10)

  // Auto-save game state on changes
  useEffect(() => {
    if (gameStatus === 'betting' || gameStatus === 'finished') {
      saveGameState({
        deck,
        playerHand,
        dealerHand,
        gameStatus,
        currentBet,
        bankroll: deck.bankroll
      })
    }
  }, [deck, playerHand, dealerHand, gameStatus, currentBet])

  const calculateHandValue = useCallback((hand) => {
    let value = 0
    let aces = 0

    hand.forEach(card => {
      if (card) {
        value += card.value
        if (card.rank === 'A') {
          aces += 1
        }
      }
    })

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10
      aces -= 1
    }

    return value
  }, [])

  const dealInitialCards = useCallback(() => {
    if (currentBet > deck.bankroll) {
      alert('Not enough bankroll for this bet!')
      return
    }

    // Get current deck state
    const currentDeck = deck
    const currentBankroll = currentDeck.bankroll
    const currentDeckArray = currentDeck.deck

    // Create new deck array with cards removed
    const newDeckArray = [...currentDeckArray]

    // Deal 2 cards to each
    const newPlayerHand = []
    const newDealerHand = []

    for (let i = 0; i < 4; i++) {
      if (newDeckArray.length > 0) {
        const card = newDeckArray.shift()
        if (i < 2) {
          newPlayerHand.push({ ...card, flipped: true })
        } else if (i === 2) {
          // Dealer's second card - keep face down
          newDealerHand.push({ ...card, flipped: false })
        } else {
          newDealerHand.push({ ...card, flipped: true })
        }
      }
    }

    // Update bankroll and deck
    setDeck(prev => ({
      ...prev,
      bankroll: prev.bankroll - currentBet,
      deck: newDeckArray
    }))

    setPlayerHand(newPlayerHand)
    setDealerHand(newDealerHand)
    setGameStatus('playing')
    setCurrentBet(0)
  }, [currentBet, deck])

  const playerHit = useCallback(() => {
    // Get current deck state to avoid stale closure
    const currentDeck = deck
    const currentDeckArray = currentDeck.deck
    const currentBankroll = currentDeck.bankroll

    // Draw a card
    const newDeckArray = [...currentDeckArray]
    const card = newDeckArray.shift()

    if (card) {
      // Update deck
      setDeck(prev => ({
        ...prev,
        deck: newDeckArray
      }))

      // Update player hand
      setPlayerHand(prev => [...prev, { ...card, flipped: true }])

      // Calculate hand value
      const value = calculateHandValue([...playerHand, card])
      if (value > 21) {
        setGameStatus('busted')
      }
    }
  }, [deck, playerHand, calculateHandValue])

  const playerStand = useCallback(() => {
    // Get current deck state to avoid stale closure
    const currentDeck = deck
    const currentDealerHand = dealerHand
    const currentPlayerHand = playerHand
    const currentBankroll = currentDeck.bankroll

    // Dealer plays
    const newDealerHand = [...currentDealerHand]
    let dealerValue = calculateHandValue(newDealerHand)

    while (dealerValue < 17) {
      const newDeckArray = [...currentDeck.deck]
      const card = newDeckArray.shift()
      if (card) {
        newDealerHand.push({ ...card, flipped: true })
        dealerValue = calculateHandValue(newDealerHand)
      }
    }

    setDealerHand(newDealerHand)
    determineWinner(currentPlayerHand, newDealerHand, currentBankroll)
  }, [deck, dealerHand, playerHand, calculateHandValue])

  const determineWinner = useCallback((playerHand, dealerHand, bankroll) => {
    const playerValue = calculateHandValue(playerHand)
    const dealerValue = calculateHandValue(dealerHand)

    let payout = 0
    if (dealerValue > 21) {
      setGameStatus('player-wins')
      payout = bankroll * 2
    } else if (playerValue > dealerValue) {
      setGameStatus('player-wins')
      payout = bankroll * 2
    } else if (playerValue < dealerValue) {
      setGameStatus('dealer-wins')
      payout = 0
    } else {
      setGameStatus('push')
      payout = bankroll
    }

    // Update bankroll
    setDeck(prev => ({
      ...prev,
      bankroll: prev.bankroll + payout
    }))
  }, [calculateHandValue])

  const resetGame = useCallback(() => {
    const newDeck = createDeck()
    newDeck.shuffle()
    setDeck(prev => ({
      ...prev,
      deck: newDeck.deck,
      bankroll: prev.bankroll + currentBet // Return bet on reset
    }))
    setPlayerHand([])
    setDealerHand([])
    setGameStatus('betting')
    setCurrentBet(0)
  }, [createDeck, currentBet])

  const contextValue = useMemo(() => ({
    deck,
    playerHand,
    dealerHand,
    gameStatus,
    currentBet,
    setDeck,
    setPlayerHand,
    setDealerHand,
    setGameStatus,
    setCurrentBet,
    calculateHandValue,
    dealInitialCards,
    playerHit,
    playerStand,
    resetGame
  }), [deck, playerHand, dealerHand, gameStatus, currentBet, calculateHandValue, dealInitialCards, playerHit, playerStand, resetGame])

  // Theme configuration
  const theme = useMemo(() => ({
    cardColor: '#ffffff',
    cardBorder: '#333333',
    cardText: '#000000',
    cardBack: '#1a4d2e',
    primaryColor: '#2c5f2d',
    secondaryColor: '#4a905e',
    accentColor: '#87ceeb',
    textColor: '#ffffff',
    backgroundColor: '#1a1a1a'
  }), [])

  return (
    <GameContext.Provider value={{ ...contextValue, theme }}>
      {children}
    </GameContext.Provider>
  )
}
