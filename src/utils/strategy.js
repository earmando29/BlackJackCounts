import { calculateHandValue } from './gameLogic'

/**
 * EV Strategy Engine — 6-deck S17 DAS (Double After Split)
 *
 * Contains:
 *  1. Basic strategy lookup tables (hard, soft, pair)
 *  2. Hi-Lo deviation indices (Illustrious 18 + defensive)
 *  3. Hand classifier
 *  4. Recommendation engine
 *  5. EV classifier
 *
 * Pure functions — no React, no side-effects, fully testable.
 */

// ── Dealer upcard value → table column index ──────────────────────
// 2=0, 3=1, 4=2, 5=3, 6=4, 7=5, 8=6, 9=7, T=8, A=9
const dIdx = (upcard) => (upcard.value === 11 ? 9 : upcard.value - 2)

// ── Action codes ──────────────────────────────────────────────────
// H = Hit | S = Stand | D = Double (else Hit) | d = Double (else Stand) | P = Split
const ACTION_LABELS = { H: 'Hit', S: 'Stand', D: 'Double', P: 'Split', d: 'Double' }
const actionName = (code) => ACTION_LABELS[code] ?? code

// ── Basic Strategy Tables (6-deck, S17, DAS) ─────────────────────
// Each string is 10 chars → dealer 2,3,4,5,6,7,8,9,T,A

const HARD = {
  //       2345678 9TA
  8:  'HHHHHHHHHH',
  9:  'HDDDDHHHHH',
  10: 'DDDDDDDDHH',
  11: 'DDDDDDDDDH',
  12: 'HHSSSHHHHH',
  13: 'SSSSSHHHHH',
  14: 'SSSSSHHHHH',
  15: 'SSSSSHHHHH',
  16: 'SSSSSHHHHH',
}

const SOFT = {
  //       2345678 9TA
  13: 'HHHDDHHHHH', // A,2
  14: 'HHHDDHHHHH', // A,3
  15: 'HHDDDHHHHH', // A,4
  16: 'HHDDDHHHHH', // A,5
  17: 'HDDDDHHHHH', // A,6
  18: 'SddddSSHHH', // A,7 — d = double or stand
  19: 'SSSSSSSSSS', // A,8
  20: 'SSSSSSSSSS', // A,9
}

const PAIRS = {
  //       2345678 9TA
  11: 'PPPPPPPPPP', // A,A
  10: 'SSSSSSSSSS', // T,T — never split (basic)
  9:  'PPPPPSPPSS', // 9,9
  8:  'PPPPPPPPPP', // 8,8
  7:  'PPPPPPHHHH', // 7,7
  6:  'PPPPPHHHHH', // 6,6
  5:  'DDDDDDDDHH', // 5,5 — never split, play as hard 10
  4:  'HHHPPHHHHH', // 4,4
  3:  'PPPPPPHHHH', // 3,3
  2:  'PPPPPPHHHH', // 2,2
}

// ── Hi-Lo Deviation Indices ──────────────────────────────────────
// tc = true count threshold. If TC ≥ tc → play `above`, else `below`.
// dealer = card value (2-10, 11=Ace)
const DEVIATIONS = [
  // --- Illustrious 18 (positive deviations) ---
  { type: 'hard', total: 16, dealer: 10, tc: 0,  above: 'S', below: 'H' },
  { type: 'hard', total: 15, dealer: 10, tc: 4,  above: 'S', below: 'H' },
  { type: 'hard', total: 10, dealer: 10, tc: 4,  above: 'D', below: 'H' },
  { type: 'hard', total: 10, dealer: 11, tc: 4,  above: 'D', below: 'H' },
  { type: 'hard', total: 12, dealer: 3,  tc: 2,  above: 'S', below: 'H' },
  { type: 'hard', total: 12, dealer: 2,  tc: 3,  above: 'S', below: 'H' },
  { type: 'hard', total: 11, dealer: 11, tc: 1,  above: 'D', below: 'H' },
  { type: 'hard', total: 9,  dealer: 2,  tc: 1,  above: 'D', below: 'H' },
  { type: 'hard', total: 9,  dealer: 7,  tc: 3,  above: 'D', below: 'H' },
  { type: 'hard', total: 16, dealer: 9,  tc: 5,  above: 'S', below: 'H' },
  { type: 'pair', pairVal: 10, dealer: 5, tc: 5,  above: 'P', below: 'S' },
  { type: 'pair', pairVal: 10, dealer: 6, tc: 4,  above: 'P', below: 'S' },
  // --- Defensive deviations (deviate from basic at low counts) ---
  { type: 'hard', total: 13, dealer: 2,  tc: -1, above: 'S', below: 'H' },
  { type: 'hard', total: 13, dealer: 3,  tc: -2, above: 'S', below: 'H' },
  { type: 'hard', total: 12, dealer: 4,  tc: 0,  above: 'S', below: 'H' },
  { type: 'hard', total: 12, dealer: 5,  tc: -2, above: 'S', below: 'H' },
  { type: 'hard', total: 12, dealer: 6,  tc: -1, above: 'S', below: 'H' },
]

// ── Hand Classification ──────────────────────────────────────────

function classifyHand(cards) {
  if (!cards || cards.length === 0) return null
  const total = calculateHandValue(cards)
  const isPair = cards.length === 2 && cards[0].value === cards[1].value
  const hasAce = cards.some(c => c.rank === 'A')
  const hardTotal = cards.reduce((s, c) => s + (c.rank === 'A' ? 1 : c.value), 0)
  const isSoft = hasAce && hardTotal + 10 <= 21 && total === hardTotal + 10
  return { total, isSoft, isPair, pairValue: isPair ? cards[0].value : null }
}

// ── Basic Strategy Lookup ────────────────────────────────────────

function lookupBasic(hand, di) {
  // Pairs first (pair table may return non-P actions like S for T,T)
  if (hand.isPair && PAIRS[hand.pairValue]) {
    return PAIRS[hand.pairValue][di]
  }
  // Soft totals
  if (hand.isSoft && SOFT[hand.total]) {
    return SOFT[hand.total][di]
  }
  // Hard totals
  if (hand.total <= 8) return 'H'
  if (hand.total >= 17) return 'S'
  if (HARD[hand.total]) return HARD[hand.total][di]
  return 'H'
}

// ── Apply action constraints ─────────────────────────────────────

function constrain(action, canDouble, canSplit) {
  if (action === 'D' && !canDouble) return 'H'
  if (action === 'd' && !canDouble) return 'S'
  if (action === 'P' && !canSplit) return null // fall through to hard/soft
  return action
}

// ── EV Classification ────────────────────────────────────────────

function classifyEV(total, dealerUp, action, tc, isSoft) {
  const dealerWeak = dealerUp >= 2 && dealerUp <= 6

  if (action === 'D') {
    if (dealerWeak || total >= 10) return { label: '+EV', color: '#2ecc71' }
    return { label: '~EV', color: '#f1c40f' }
  }
  if (action === 'P') {
    return dealerWeak ? { label: '+EV', color: '#2ecc71' } : { label: '~EV', color: '#f1c40f' }
  }
  if (action === 'S') {
    if (total >= 17 && dealerWeak) return { label: '+EV', color: '#2ecc71' }
    if (total >= 17) return { label: '~EV', color: '#f1c40f' }
    if (dealerWeak) return { label: '~EV', color: '#f1c40f' }
    return { label: '-EV', color: '#e74c3c' }
  }
  // Hitting
  if (total <= 11) return { label: '+EV', color: '#2ecc71' }
  if (isSoft) return { label: '~EV', color: '#f1c40f' }
  return dealerWeak ? { label: '~EV', color: '#f1c40f' } : { label: '-EV', color: '#e74c3c' }
}

// ── Main Recommendation Engine ───────────────────────────────────

/**
 * Returns { action, basicAction, deviation, ev, hand } or null.
 *
 * @param {Object[]} cards        - Player's card objects
 * @param {Object}   dealerUpcard - Dealer's visible card
 * @param {number}   trueCount    - Current true count
 * @param {Object}   opts         - { canDouble, canSplit }
 */
export function getRecommendation(cards, dealerUpcard, trueCount, opts) {
  if (!cards?.length || !dealerUpcard) return null
  const hand = classifyHand(cards)
  if (!hand || hand.total >= 21) return null

  const di = dIdx(dealerUpcard)
  const dealerVal = dealerUpcard.value === 11 ? 11 : dealerUpcard.value

  // 1. Basic strategy lookup
  let rawBasic = lookupBasic(hand, di)

  // If pair action is P but can't split, fall through to hard/soft
  if (rawBasic === 'P' && !opts.canSplit) {
    const nonPair = { ...hand, isPair: false }
    rawBasic = lookupBasic(nonPair, di)
  }

  const basicAction = constrain(rawBasic, opts.canDouble, opts.canSplit) ?? rawBasic
  let action = basicAction

  // 2. Check deviations
  let deviation = null
  for (const dev of DEVIATIONS) {
    let matchHand = false
    if (dev.type === 'pair') {
      matchHand = hand.isPair && hand.pairValue === dev.pairVal
    } else if (dev.type === 'hard') {
      matchHand = !hand.isSoft && !hand.isPair && hand.total === dev.total
      // Also check pairs playing as hard (e.g., 8+8 = hard 16)
      if (!matchHand && hand.isPair && !hand.isSoft) {
        matchHand = hand.total === dev.total
      }
    } else if (dev.type === 'soft') {
      matchHand = hand.isSoft && hand.total === dev.total
    }

    if (!matchHand || dev.dealer !== dealerVal) continue

    const devAction = trueCount >= dev.tc ? dev.above : dev.below
    const constrained = constrain(devAction, opts.canDouble, opts.canSplit)
    if (!constrained) continue

    if (constrained !== basicAction) {
      const tcLabel = `${dev.tc >= 0 ? '+' : ''}${dev.tc}`
      deviation = {
        action: constrained,
        tc: dev.tc,
        note: trueCount >= dev.tc
          ? `TC ≥ ${tcLabel}: ${actionName(constrained)} instead of ${actionName(basicAction)}`
          : `TC < ${tcLabel}: ${actionName(constrained)} instead of ${actionName(basicAction)}`,
      }
      action = constrained
    }
    break
  }

  // 3. EV classification
  const ev = classifyEV(hand.total, dealerVal, action, trueCount, hand.isSoft)

  return { action, basicAction, deviation, ev, hand }
}
