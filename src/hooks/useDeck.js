import { useState, useCallback } from 'react'

const useDeck = () => {
  const createDeck = useCallback(() => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades']
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    const values = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
      '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 10, 'Q': 10, 'K': 10, 'A': 11
    }

    const deck = []
    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({
          suit,
          rank,
          value: values[rank],
          flipped: false
        })
      })
    })

    return {
      deck,
      runningCount: 0,
      trueCount: 0,
      bankroll: 1000,
      shuffle: () => {
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          [deck[i], deck[j]] = [deck[j], deck[i]]
        }
      }
    }
  }, [])

  const drawCard = useCallback((deck) => {
    if (deck.deck.length === 0) {
      return { card: null, message: 'Deck empty, reshuffling...' }
    }

    const card = { ...deck.deck.shift() }
    card.flipped = true

    // Update running count
    const count = card.value
    if (count === 10) {
      deck.runningCount -= 1
    } else if (count === 11) {
      deck.runningCount += 1
    } else {
      deck.runningCount += (11 - count)
    }

    // Calculate true count (approximate)
    const cardsRemaining = deck.deck.length
    const estimatedDecks = Math.max(1, Math.ceil(cardsRemaining / 52))
    deck.trueCount = Math.round(deck.runningCount / estimatedDecks)

    return { card, deck }
  }, [])

  const resetDeck = useCallback((deck) => {
    const newDeck = createDeck()
    newDeck.shuffle()
    return newDeck
  }, [createDeck])

  return {
    createDeck,
    drawCard,
    resetDeck
  }
}

export default useDeck
