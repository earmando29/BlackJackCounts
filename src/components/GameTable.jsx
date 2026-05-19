import { useContext } from 'react'
import { GameContext } from '../context/GameContext'
import { getHiLoValue } from '../hooks/useDeck'
import Card from './Card'
import HandSpot from './HandSpot'

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
      fontSize: 10, fontWeight: 'bold',
    }}>
      {v > 0 ? '+' : ''}{v}
    </div>
  )
}

const GameTable = () => {
  const {
    dealerHand, gameStatus, numSpots, showCounts, hands,
    calculateHandValue, newHand,
  } = useContext(GameContext)

  const visibleCards = dealerHand.filter(c => c.flipped)
  const dealerValue = calculateHandValue(visibleCards)
  const dealerFullValue = calculateHandValue(dealerHand)
  const showFull = gameStatus === 'finished'
  const isBetting = gameStatus === 'betting'

  // During betting: show original spots (0..numSpots-1)
  // During play/finished: show all hands with bets
  const handIndices = isBetting
    ? Array.from({ length: numSpots }, (_, i) => i)
    : hands.map((_, i) => i).filter(i => hands[i].bet > 0)

  return (
    <div style={{
      backgroundColor: '#1a472a',
      borderRadius: 16, padding: 20,
      minHeight: 460, position: 'relative',
      marginBottom: 12,
    }}>
      {/* Dealer */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 8 }}>
          Dealer{' '}
          {dealerHand.length > 0 && (
            <span style={{ fontSize: 14, color: '#aaa' }}>
              ({showFull ? dealerFullValue : dealerValue})
            </span>
          )}
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 112 }}>
          {dealerHand.map(card => (
            <div key={card.id} style={{ position: 'relative' }}>
              <CountBadge card={card} show={showCounts} />
              <Card card={card} />
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        borderTop: '2px dashed rgba(255,255,255,0.15)',
        margin: '12px 0 16px',
      }} />

      {/* Player hand spots */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {handIndices.map(i => (
          <HandSpot key={`${i}-${hands[i]?.spotIndex}`} handIndex={i} />
        ))}
      </div>

      {/* Finished overlay */}
      {gameStatus === 'finished' && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}>
          <button onClick={newHand} style={{
            padding: '12px 32px',
            backgroundColor: '#4ecdc4', color: '#fff',
            border: 'none', borderRadius: 8,
            cursor: 'pointer', fontSize: 16, fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            Next Hand
          </button>
        </div>
      )}
    </div>
  )
}

export default GameTable
