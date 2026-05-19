import { useContext, useMemo } from 'react'
import { GameContext } from '../context/GameContext'
import { getRecommendation } from '../utils/strategy'

const ACTION_EMOJI = { H: '👆', S: '✋', D: '💰', P: '✂️', d: '💰' }
const ACTION_LABELS = { H: 'Hit', S: 'Stand', D: 'Double', P: 'Split', d: 'Double' }

/**
 * EV Advisor — shows optimal play for the current hand.
 * Always visible during play. Deviation alerts when counts toggled on.
 */
const EvAdvisor = () => {
  const {
    hands, activeHandIndex, dealerHand, trueCount,
    gameStatus, bankroll, showCounts,
  } = useContext(GameContext)

  const rec = useMemo(() => {
    if (gameStatus !== 'playing' || !dealerHand.length) return null
    const hand = hands[activeHandIndex]
    if (!hand?.cards.length) return null

    const dealerUpcard = dealerHand[0]
    const canDouble = hand.cards.length === 2 && hand.bet <= bankroll
    const canSplit = hand.cards.length === 2
      && hand.cards[0]?.value === hand.cards[1]?.value
      && hand.originalBet <= bankroll
      && hands.filter(h => h.spotIndex === hand.spotIndex).length < 5

    return getRecommendation(hand.cards, dealerUpcard, trueCount, { canDouble, canSplit })
  }, [hands, activeHandIndex, dealerHand, trueCount, gameStatus, bankroll])

  if (!rec) return null

  const emoji = ACTION_EMOJI[rec.action] ?? ''
  const label = ACTION_LABELS[rec.action] ?? rec.action
  const hasDeviation = rec.deviation && showCounts

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 4, padding: '6px 12px',
      backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 8,
    }}>
      {/* Main recommendation line */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
      }}>
        <span style={{
          padding: '2px 8px', borderRadius: 4, fontWeight: 'bold',
          backgroundColor: rec.ev.color, color: '#fff', fontSize: 11,
        }}>
          {rec.ev.label}
        </span>
        <span style={{ color: '#fff', fontWeight: 'bold' }}>
          {emoji} {label}
        </span>
        {rec.basicAction !== rec.action && showCounts && (
          <span style={{ color: '#aaa', fontSize: 11 }}>
            (basic: {ACTION_LABELS[rec.basicAction]})
          </span>
        )}
      </div>

      {/* Deviation alert */}
      {hasDeviation && (
        <div style={{
          fontSize: 11, color: '#ffc220', fontStyle: 'italic',
          textAlign: 'center',
        }}>
          ⚡ {rec.deviation.note}
        </div>
      )}
    </div>
  )
}

export default EvAdvisor

/**
 * Returns the recommended action code for button highlighting.
 * Separated so ControlPanel can use it without importing the full component.
 */
export { getRecommendation }
