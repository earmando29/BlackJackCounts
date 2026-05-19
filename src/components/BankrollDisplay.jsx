import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

const BankrollDisplay = () => {
  const { deck } = useContext(GameContext)

  return (
    <div style={{
      backgroundColor: '#2d5a3f',
      borderRadius: '12px',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <span style={{ color: '#aaa', fontSize: '14px' }}>Bankroll:</span>
        <span style={{ color: '#4ecdc4', fontSize: '20px', fontWeight: 'bold' }}>
          ${deck.bankroll.toFixed(2)}
        </span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ color: '#aaa', fontSize: '12px' }}>Running Count:</span>
        <span style={{ color: deck.runningCount > 0 ? '#ff6b6b' : deck.runningCount < 0 ? '#4ecdc4' : '#fff', fontSize: '18px', fontWeight: 'bold' }}>
          {deck.runningCount}
        </span>
      </div>
    </div>
  )
}

export default BankrollDisplay
