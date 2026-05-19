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

const HandSpot = ({ index }) => {
  const {
    hands, gameStatus, activeHandIndex, selectedSpot,
    setSelectedSpot, numSpots, showCounts, calculateHandValue,
  } = useContext(GameContext)

  if (index >= numSpots) return null
  const hand = hands[index]
  const isActive = gameStatus === 'playing' && index === activeHandIndex
  const isSelected = gameStatus === 'betting' && index === selectedSpot
  const hasCards = hand.cards.length > 0
  const handValue = hasCards ? calculateHandValue(hand.cards) : 0

  const resultColor = {
    'Win!': '#2ecc71', 'Blackjack!': '#2ecc71',
    'Push': '#f1c40f', 'Bust': '#e74c3c',
    'Lose': '#e74c3c', 'Dealer BJ': '#e74c3c',
  }[hand.result] ?? '#fff'

  return (
    <div
      onClick={() => { if (gameStatus === 'betting') setSelectedSpot(index) }}
      style={{
        flex: 1, minWidth: 180, maxWidth: 360,
        border: `3px solid ${
          isActive ? '#4ecdc4'
            : isSelected ? '#ffc220'
            : 'rgba(255,255,255,0.15)'
        }`,
        borderRadius: 12, padding: 12,
        backgroundColor: 'rgba(0,0,0,0.15)',
        cursor: gameStatus === 'betting' ? 'pointer' : 'default',
        animation: isActive ? 'glowPulse 1.8s ease-in-out infinite' : 'none',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 8, fontSize: 13, color: '#aaa',
      }}>
        <span>Hand {index + 1}</span>
        {hand.bet > 0 && (
          <span style={{ color: '#ffc220', fontWeight: 'bold' }}>
            Bet: ${hand.bet}
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
              ? `${hand.result} (${handValue})`
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
