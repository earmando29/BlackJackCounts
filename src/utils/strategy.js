import { calculateHandValue } from './gameLogic'

/**
 * EV Strategy Engine — 6-deck S17 DAS (Double After Split)
 *
 * Contains:
 *  1. Basic strategy lookup tables (hard, soft, pair)
 *  2. Hi-Lo deviation indices (Illustrious 18 + defensive)
 *  3. Hand classifier + EV lookup tables
 *  4. Recommendation engine with numeric EV
 *
 * Pure functions — no React, no side-effects, fully testable.
 */

// ── Dealer upcard → table column index ───────────────────────────
// 2=0, 3=1, 4=2, 5=3, 6=4, 7=5, 8=6, 9=7, T=8, A=9
const dIdx = (upcard) => (upcard.value === 11 ? 9 : upcard.value - 2)

// ── Action codes & labels ────────────────────────────────────────
const ACTION_LABELS = { H: 'Hit', S: 'Stand', D: 'Double', P: 'Split', d: 'Double' }
const actionName = (code) => ACTION_LABELS[code] ?? code

// ── Basic Strategy Tables (6-deck, S17, DAS) ─────────────────────
// Each string is 10 chars → dealer 2,3,4,5,6,7,8,9,T,A

const HARD = {
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
  13: 'HHHDDHHHHH',
  14: 'HHHDDHHHHH',
  15: 'HHDDDHHHHH',
  16: 'HHDDDHHHHH',
  17: 'HDDDDHHHHH',
  18: 'SddddSSHHH',
  19: 'SSSSSSSSSS',
  20: 'SSSSSSSSSS',
}

const PAIRS = {
  11: 'PPPPPPPPPP',
  10: 'SSSSSSSSSS',
  9:  'PPPPPSPPSS',
  8:  'PPPPPPPPPP',
  7:  'PPPPPPHHHH',
  6:  'PPPPPHHHHH',
  5:  'DDDDDDDDHH',
  4:  'HHHPPHHHHH',
  3:  'PPPPPPHHHH',
  2:  'PPPPPPHHHH',
}

// ── EV Lookup Tables (per $1 bet, optimal play, 6-deck S17) ─────
// Source: standard blackjack combinatorial analysis
// Index: dealer 2, 3, 4, 5, 6, 7, 8, 9, T, A

const HARD_EV = {
  5:  [.12, .13, .15, .17, .19, .08, .03, -.02, -.08, -.11],
  6:  [.12, .13, .15, .17, .19, .07, .03, -.02, -.08, -.11],
  7:  [.10, .12, .14, .17, .18, .10, .04, -.02, -.07, -.10],
  8:  [.14, .15, .17, .20, .22, .12, .06, .01, -.06, -.09],
  9:  [.14, .21, .27, .33, .36, .09, .04, -.02, -.08, -.11],
  10: [.44, .47, .50, .54, .57, .34, .23, .11, -.04, -.10],
  11: [.54, .57, .60, .63, .65, .41, .30, .18, .05, .13],
  12: [-.25, -.24, -.21, -.17, -.15, -.21, -.24, -.27, -.29, -.29],
  13: [-.23, -.21, -.18, -.14, -.12, -.26, -.28, -.31, -.32, -.33],
  14: [-.24, -.22, -.19, -.15, -.13, -.27, -.29, -.32, -.34, -.35],
  15: [-.25, -.23, -.20, -.16, -.15, -.28, -.31, -.34, -.42, -.47],
  16: [-.26, -.24, -.21, -.18, -.16, -.29, -.32, -.35, -.46, -.51],
  17: [-.15, -.12, -.09, -.05, -.03, -.11, -.38, -.42, -.42, -.48],
  18: [.12, .15, .18, .22, .24, .40, .11, -.18, -.18, -.10],
  19: [.39, .41, .44, .48, .50, .62, .60, .28, .07, .18],
  20: [.64, .66, .68, .72, .74, .77, .79, .76, .55, .44],
}

const SOFT_EV = {
  13: [.04, .06, .10, .15, .18, .04, -.01, -.06, -.12, -.14],
  14: [.05, .07, .11, .16, .19, .04, -.01, -.06, -.12, -.14],
  15: [.06, .10, .14, .19, .22, .04, -.01, -.06, -.12, -.14],
  16: [.06, .10, .15, .20, .23, .03, -.02, -.07, -.12, -.14],
  17: [.02, .12, .18, .24, .27, .00, -.05, -.10, -.15, -.17],
  18: [.12, .18, .24, .30, .33, .40, .11, -.01, -.09, -.04],
  19: [.39, .41, .44, .48, .50, .62, .60, .28, .07, .18],
  20: [.64, .66, .68, .72, .74, .77, .79, .76, .55, .44],
}

// TC adjustment: each +1 TC ≈ +0.5% edge shift
const TC_EV_SHIFT = 0.005

// ── Hi-Lo Deviation Indices ──────────────────────────────────────

const DEVIATIONS = [
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

// ── Strategy Lookups ─────────────────────────────────────────────

function lookupBasic(hand, di) {
  if (hand.isPair && PAIRS[hand.pairValue]) return PAIRS[hand.pairValue][di]
  if (hand.isSoft && SOFT[hand.total]) return SOFT[hand.total][di]
  if (hand.total <= 8) return 'H'
  if (hand.total >= 17) return 'S'
  if (HARD[hand.total]) return HARD[hand.total][di]
  return 'H'
}

function constrain(action, canDouble, canSplit) {
  if (action === 'D' && !canDouble) return 'H'
  if (action === 'd' && !canDouble) return 'S'
  if (action === 'P' && !canSplit) return null
  return action
}

// ── EV Calculation ───────────────────────────────────────────────

/**
 * Look up the per-unit EV for this hand vs dealer, adjusted for TC.
 * Returns a number like +0.54 or -0.46.
 */
function lookupEV(hand, di, trueCount) {
  let baseEV = 0

  if (hand.isSoft && SOFT_EV[hand.total]) {
    baseEV = SOFT_EV[hand.total][di]
  } else if (HARD_EV[hand.total]) {
    baseEV = HARD_EV[hand.total][di]
  } else if (hand.total <= 4) {
    baseEV = HARD_EV[5][di] // treat very low totals like 5
  }

  // Adjust for true count
  return baseEV + (trueCount * TC_EV_SHIFT)
}

// ── Main Recommendation Engine ───────────────────────────────────

/**
 * Returns { action, basicAction, deviation, ev, hand } or null.
 *
 * ev now contains:
 *   { label, color, perUnit, dollar }
 *   perUnit = EV per $1 bet  |  dollar = EV × actual bet
 */
export function getRecommendation(cards, dealerUpcard, trueCount, opts) {
  if (!cards?.length || !dealerUpcard) return null
  const hand = classifyHand(cards)
  if (!hand || hand.total >= 21) return null

  const di = dIdx(dealerUpcard)
  const dealerVal = dealerUpcard.value === 11 ? 11 : dealerUpcard.value

  // 1. Basic strategy
  let rawBasic = lookupBasic(hand, di)
  if (rawBasic === 'P' && !opts.canSplit) {
    rawBasic = lookupBasic({ ...hand, isPair: false }, di)
  }
  const basicAction = constrain(rawBasic, opts.canDouble, opts.canSplit) ?? rawBasic
  let action = basicAction

  // 2. Deviations
  let deviation = null
  for (const dev of DEVIATIONS) {
    let match = false
    if (dev.type === 'pair') {
      match = hand.isPair && hand.pairValue === dev.pairVal
    } else if (dev.type === 'hard') {
      match = (!hand.isSoft && !hand.isPair && hand.total === dev.total)
        || (hand.isPair && !hand.isSoft && hand.total === dev.total)
    } else if (dev.type === 'soft') {
      match = hand.isSoft && hand.total === dev.total
    }
    if (!match || dev.dealer !== dealerVal) continue

    const devAction = trueCount >= dev.tc ? dev.above : dev.below
    const constrained = constrain(devAction, opts.canDouble, opts.canSplit)
    if (!constrained) continue

    if (constrained !== basicAction) {
      const tcLabel = `${dev.tc >= 0 ? '+' : ''}${dev.tc}`
      deviation = {
        action: constrained, tc: dev.tc,
        note: trueCount >= dev.tc
          ? `TC ≥ ${tcLabel}: ${actionName(constrained)} instead of ${actionName(basicAction)}`
          : `TC < ${tcLabel}: ${actionName(constrained)} instead of ${actionName(basicAction)}`,
      }
      action = constrained
    }
    break
  }

  // 3. Numeric EV
  const perUnit = lookupEV(hand, di, trueCount)
  const bet = opts.bet ?? 0
  const dollar = perUnit * bet
  const label = perUnit >= 0.05 ? '+EV' : perUnit <= -0.05 ? '-EV' : '~EV'
  const color = perUnit >= 0.05 ? '#2ecc71' : perUnit <= -0.05 ? '#e74c3c' : '#f1c40f'

  return {
    action, basicAction, deviation, hand,
    ev: { label, color, perUnit, dollar },
  }
}
