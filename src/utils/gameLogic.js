import { getHiLoValue } from '../hooks/useDeck'

/**
 * Pure game-logic helpers — no React, no side-effects.
 * Extracted so GameContext stays lean and these stay testable.
 */

/** Sum card values, adjusting aces from 11→1 as needed. */
export const calculateHandValue = (hand) => {
  let value = 0, aces = 0
  for (const c of hand) {
    if (!c) continue
    value += c.value
    if (c.rank === 'A') aces++
  }
  while (value > 21 && aces > 0) { value -= 10; aces-- }
  return value
}

/** Sum of Hi-Lo deltas for an array of cards. */
export const getCountDelta = (cards) =>
  cards.reduce((sum, c) => sum + getHiLoValue(c.rank), 0)

/** Speed level (1-5) → ms per card. */
export const SPEED_MAP = { 1: 550, 2: 400, 3: 280, 4: 170, 5: 90 }

/**
 * Simulate dealer playing out (S17).
 * Returns { finalHand, remaining, revealed } — pure, no side-effects.
 */
export const dealerPlayOut = (shoe, dHand) => {
  const hand = dHand.map(c => ({ ...c, flipped: true }))
  const remaining = [...shoe]
  const revealed = []

  // Hole card is now visible
  const hole = dHand.find(c => !c.flipped)
  if (hole) revealed.push(hole)

  let value = calculateHandValue(hand)
  let order = 1 // dealOrder for stagger animation on new draws
  while (value < 17 && remaining.length > 0) {
    const card = { ...remaining.shift(), flipped: true, dealOrder: order++ }
    hand.push(card)
    revealed.push(card)
    value = calculateHandValue(hand)
  }

  return { finalHand: hand, remaining, revealed }
}
