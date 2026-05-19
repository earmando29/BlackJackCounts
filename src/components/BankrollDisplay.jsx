import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

const BankrollDisplay = () => {
  const { bankroll, runningCount, trueCount, currentBet, cards } = useContext(GameContext)

  const countColor = runningCount > 0 ? '#ff6b6b' : runningCount < 0 ? '#4ecdc4' : '#fff'

  return (
    <div style={{
      backgroundColor: '#2d5a3f',
      borderRadius: 12,
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
    }}>
      <div>
        <span style={{ color: '#aaa', fontSize: 14 }}>Bankroll: </span>
        <span style={{ color: '#4ecdc4', fontSize: 20, fontWeight: 'bold' }}>
          ${bankroll.toFixed(2)}
        </span>
      </div>

      {currentBet > 0 && (
        <div>
          <span style={{ color: '#aaa', fontSize: 14 }}>Bet: </span>
          <span style={{ color: '#ffc220', fontSize: 18, fontWeight: 'bold' }}>
            ${currentBet}
          </span>
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#aaa', fontSize: 12 }}>Running Count: </span>
        <span style={{ color: countColor, fontSize: 18, fontWeight: 'bold' }}>
          {runningCount > 0 ? '+' : ''}{runningCount}
        </span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#aaa', fontSize: 12 }}>True Count: </span>
        <span style={{ color: countColor, fontSize: 18, fontWeight: 'bold' }}>
          {trueCount > 0 ? '+' : ''}{trueCount}
        </span>
      </div>

      <div style={{ textAlign: 'right' }}>
        <span style={{ color: '#aaa', fontSize: 12 }}>Cards left: </span>
        <span style={{ color: '#fff', fontSize: 14 }}>{cards.length}</span>
      </div>
    </div>
  )
}

export default BankrollDisplay
