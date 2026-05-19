import { useContext } from 'react'
import { GameContext } from '../context/GameContext'
import { getHiLoValue } from '../hooks/useDeck'
import Card from './Card'

/** Small badge showing the Hi-Lo value of a single card. */
const CountBadge = ({ card }) => {
  if (!card?.flipped) return null
  const v = getHiLoValue(card.rank)
  const bg = v > 0 ? '#27ae60' : v < 0 ? '#e74c3c' : '#7f8c8d'

  return (
    <div style={{
      position: 'absolute', top: -22, left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: bg, color: '#fff',
      padding: '1px 6px', borderRadius: 10,
      fontSize: 10, fontWeight: 'bold', whiteSpace: 'nowrap',
    }}>
      {v > 0 ? '+' : ''}{v}
    </div>
  )
}

const GameTable = () => {
  const {
    playerHand, dealerHand, gameStatus,
    resultMessage, calculateHandValue,
    dealInitialCards, newHand,
  } = useContext(GameContext)

  const playerValue = calculateHandValue(playerHand)
  const dealerValue = calculateHandValue(
    dealerHand.filter(c => c.flipped) // only count face-up cards for display
  )
  const dealerFullValue = calculateHandValue(dealerHand)

  const showDealerFull = gameStatus === 'finished'

  return (
    <div style={{
      backgroundColor: '#1a472a',
      borderRadius: 16, padding: 20,
      minHeight: 400, position: 'relative',
      marginBottom: 12,
    }}>
      {/* Dealer section */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 8 }}>
          Dealer {dealerHand.length > 0 && (
            <span style={{ fontSize: 14, color: '#aaa' }}>
              ({showDealerFull ? dealerFullValue : dealerValue})
            </span>
          )}
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {dealerHand.map((card, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <CountBadge card={card} />
              <Card card={card} />
            </div>
          ))}
        </div>
      </div>

      {/* Player section */}
      <div>
        <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 8 }}>
          Player {playerHand.length > 0 && (
            <span style={{ fontSize: 14, color: '#aaa' }}>
              ({playerValue})
            </span>
          )}
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {playerHand.map((card, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <CountBadge card={card} />
              <Card card={card} />
            </div>
          ))}
        </div>
      </div>

      {/* Overlays */}
      {gameStatus === 'betting' && playerHand.length === 0 && (
        <Overlay>
          <p style={{ fontSize: 20, marginBottom: 10 }}>Place your bet below, then deal!</p>
        </Overlay>
      )}

      {gameStatus === 'finished' && (
        <Overlay>
          <p style={{
            fontSize: 22, marginBottom: 12, fontWeight: 'bold',
            color: resultMessage.includes('win') || resultMessage.includes('Blackjack!')
              ? '#2ecc71' : resultMessage.includes('Push') ? '#f1c40f' : '#e74c3c',
          }}>
            {resultMessage}
          </p>
          <button onClick={newHand} style={btnStyle}>
            Next Hand
          </button>
        </Overlay>
      )}
    </div>
  )
}

const Overlay = ({ children }) => (
  <div style={{
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: '24px 40px', borderRadius: 12,
    textAlign: 'center', color: '#fff',
    zIndex: 10,
  }}>
    {children}
  </div>
)

const btnStyle = {
  padding: '10px 24px',
  backgroundColor: '#4ecdc4',
  color: '#fff', border: 'none',
  borderRadius: 6, cursor: 'pointer',
  fontSize: 16, fontWeight: 'bold',
}

export default GameTable
