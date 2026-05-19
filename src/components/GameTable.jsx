import { useContext, useState } from 'react'
import { GameContext } from '../context/GameContext'
import Card from './Card'

const GameTable = () => {
  const { deck, playerHand, dealerHand, gameStatus, resetGame } = useContext(GameContext)

  const getCardCount = (card) => {
    if (!card) return 0
    return card.value
  }

  const getCardInfo = (card) => {
    if (!card) return null
    const count = getCardCount(card)
    return (
      <div style={{
        position: 'absolute',
        top: '-30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: count > 0 ? '#ff6b6b' : count < 0 ? '#4ecdc4' : '#666',
        color: '#fff',
        padding: '2px 6px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 'bold'
      }}>
        {count > 0 ? '+' : ''}{count}
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#1a472a',
      borderRadius: '16px',
      padding: '20px',
      minHeight: '400px',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#fff', fontSize: '24px' }}>Dealer</h2>
        <h2 style={{ color: '#fff', fontSize: '24px' }}>Player</h2>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          {dealerHand.map((card, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <Card card={card} />
              {getCardInfo(card)}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          {playerHand.map((card, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <Card card={card} />
              {getCardInfo(card)}
            </div>
          ))}
        </div>
      </div>

      {gameStatus === 'betting' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '20px 40px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '20px', marginBottom: '10px' }}>Place your bet</p>
          <button
            onClick={resetGame}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4ecdc4',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Deal Cards
          </button>
        </div>
      )}

      {gameStatus === 'playing' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '20px 40px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '20px', marginBottom: '10px' }}>Game in progress...</p>
        </div>
      )}

      {gameStatus === 'finished' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '20px 40px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '20px', marginBottom: '10px' }}>
            {gameStatus === 'finished' ? 'Game Over!' : ''}
          </p>
          <button
            onClick={resetGame}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4ecdc4',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            New Game
          </button>
        </div>
      )}
    </div>
  )
}

export default GameTable
