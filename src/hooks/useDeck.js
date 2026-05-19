import { useCallback } from 'react'

/**
 * Hi-Lo card counting system (per design doc §2.1).
 * +1: 2, 3, 4, 5, 6  (low cards — good for player when removed)
 *  0: 7, 8, 9         (neutral)
 * -1: 10, J, Q, K, A  (high cards — bad for player when removed)
 */
const HI_LO_MAP = {
  '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
  '7': 0, '8': 0, '9': 0,
  '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
}

/** Get the Hi-Lo count value for a card rank. */
export const getHiLoValue = (rank) => HI_LO_MAP[rank] ?? 0

/** Fisher-Yates in-place shuffle. */
const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const GAME_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 10, 'Q': 10, 'K': 10, 'A': 11
}

const useDeck = () => {
  /** Create and shuffle a shoe with `numDecks` standard 52-card decks. */
  const createDeck = useCallback((numDecks = 1) => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades']
    const ranks = Object.keys(GAME_VALUES)

    const cards = []
    for (let d = 0; d < numDecks; d++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          cards.push({ suit, rank, value: GAME_VALUES[rank], flipped: false })
        }
      }
    }
    return shuffleArray(cards)
  }, [])

  return { createDeck, getHiLoValue }
}

export default useDeck
