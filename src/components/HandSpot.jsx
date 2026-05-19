import { useContext } from 'react'
import { GameContext } from '../context/GameContext'
import { getHiLoValue } from '../hooks/useDeck'
import Card from './Card'

/** Small Hi-Lo badge on a card. Hidden when showCounts is off. */
const CountBadge = ({ card, show }) => {
  if (!show || !card?.flipped) return null
  const v = getHiLoValue(card.rank)
  const bg = v > 0 ? '#27ae60' : v < 0 ? '#e74c3c' : '#7f8c8d'
  return (
    <div style={{
      position: 'absolute', top: -20, left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: bg, color: '#fff',
      padding: '1px 6px', borderRadius: 10,
      fontSize: 10, fontWeight: 'bold', whiteSpace: 'nowrap',
    }}>
      {v > 0 ? '+' : ''}{v}
    </div>
  )
}

/** Generate a label like "Hand 1", "Hand 1A", "Hand 1B" */
const getHandLabel = (hand, allHands) => {
  const spotsForThisSpot = allHands.filter(h => h.spotIndex === hand.spotIndex && h.bet > 0)
  const base = `Hand ${hand.spotIndex + 1}`
  if (spotsForThisSpot.length <= 1) return base
  const letter = String.fromCharCode(65 + spotsForThisSpot.indexOf(hand))
  return `${base}${letter}`
}

/**
 * Renders a single hand — works for both betting slots and in-play hands.
 * During betting: handIndex === spotIndex (flat 0-2)
 * During play:    handIndex is position in the dynamic hands array
 */
const HandSpot = ({ handIndex }) => {
  const {
    hands, gameStatus, activeHandIndex, selectedSpot,
    setSelectedSpot, numSpots, showCounts, calculateHandValue,
  } = useContext(GameContext)

  const hand = hands[handIndex]
  if (!hand) return null

  const isBetting = gameStatus === 'betting'
  // During betting, hide spots beyond numSpots
  if (isBetting && hand.spotIndex >= numSpots) return null

  const isActive = gameStatus === 'playing' && handIndex === activeHandIndex
  const isSelected = isBetting && hand.spotIndex === selectedSpot
  const hasCards = hand.cards.length > 0
  const handValue = hasCards ? calculateHandValue(hand.cards) : 0
  const label = getHandLabel(hand, hands)

  const getResultColor = (result) => {
    if (!result || result === 'stood') return '#fff'
    if (result.startsWith('Win') || result.startsWith('Blackjack')) return '#2ecc71'
    if (result.startsWith('Push')) return '#f1c40f'
    return '#e74c3c'
  }
  const resultColor = getResultColor(hand.result)

  return (
    <div
      onClick={() => { if (isBetting) setSelectedSpot(hand.spotIndex) }}
      style={{
        flex: 1, minWidth: 160, maxWidth: 360,
        border: `3px solid ${
          isActive ? '#4ecdc4'
            : isSelected ? '#ffc220'
            : 'rgba(255,255,255,0.15)'
        }`,
        borderRadius: 12, padding: 12,
        backgroundColor: 'rgba(0,0,0,0.15)',
        cursor: isBetting ? 'pointer' : 'default',
        animation: isActive ? 'glowPulse 1.8s ease-in-out infinite' : 'none',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 8, fontSize: 13, color: '#aaa',
      }}>
        <span>
          {label}
          {hand.isSplitHand && (
            <span style={{ color: '#4ecdc4', marginLeft: 4, fontSize: 10 }}>✂ split</span>
          )}
        </span>
        {hand.bet > 0 && (
          <span style={{ color: '#ffc220', fontWeight: 'bold' }}>
            ${hand.bet}
          </span>
        )}
      </div>

      {/* Cards or placeholder */}
      {hasCards ? (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 112 }}>
            {hand.cards.map(card => (
              <div key={card.id} style={{ position: 'relative' }}>
                <CountBadge card={card} show={showCounts} />
                <Card card={card} />
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 8, fontSize: 14, fontWeight: 'bold',
            color: hand.result ? resultColor : '#fff',
            textAlign: 'center',
          }}>
            {hand.result && hand.result !== 'stood'
              ? hand.result
              : `Value: ${handValue}`
            }
          </div>
        </>
      ) : (
        <div style={{
          height: 112, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#666', fontSize: 14,
        }}>
          {hand.bet > 0
            ? `$${hand.bet} wagered`
            : (isSelected ? 'Add chips below ↓' : 'Click to select')
          }
        </div>
      )}
    </div>
  )
}

export default HandSpot
