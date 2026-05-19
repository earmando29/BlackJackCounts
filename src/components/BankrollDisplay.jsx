import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

const BankrollDisplay = () => {
  const {
    bankroll, runningCount, trueCount, cards,
    showCounts, setShowCounts, hands, numSpots,
  } = useContext(GameContext)

  const countColor = runningCount > 0 ? '#ff6b6b' : runningCount < 0 ? '#4ecdc4' : '#fff'
  const totalBet = hands.slice(0, numSpots).reduce((s, h) => s + h.bet, 0)

  return (
    <div style={{
      backgroundColor: '#2d5a3f',
      borderRadius: 12, padding: '10px 20px',
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', flexWrap: 'wrap', gap: 10,
      marginBottom: 12,
    }}>
      <div>
        <span style={{ color: '#aaa', fontSize: 13 }}>Bankroll: </span>
        <span style={{ color: '#4ecdc4', fontSize: 20, fontWeight: 'bold' }}>
          ${bankroll.toFixed(0)}
        </span>
      </div>

      {totalBet > 0 && (
        <div>
          <span style={{ color: '#aaa', fontSize: 13 }}>Total Bet: </span>
          <span style={{ color: '#ffc220', fontSize: 17, fontWeight: 'bold' }}>${totalBet}</span>
        </div>
      )}

      {/* Counts — hidden by default */}
      {showCounts && (
        <>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#aaa', fontSize: 11 }}>RC: </span>
            <span style={{ color: countColor, fontSize: 16, fontWeight: 'bold' }}>
              {runningCount > 0 ? '+' : ''}{runningCount}
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#aaa', fontSize: 11 }}>TC: </span>
            <span style={{ color: countColor, fontSize: 16, fontWeight: 'bold' }}>
              {trueCount > 0 ? '+' : ''}{trueCount}
            </span>
          </div>
          <div>
            <span style={{ color: '#aaa', fontSize: 11 }}>Shoe: </span>
            <span style={{ color: '#fff', fontSize: 13 }}>{cards.length}</span>
          </div>
        </>
      )}

      <button
        onClick={() => setShowCounts(prev => !prev)}
        style={{
          padding: '4px 10px',
          backgroundColor: showCounts ? '#e67e22' : '#555',
          color: '#fff', border: 'none', borderRadius: 4,
          cursor: 'pointer', fontSize: 11,
        }}
        aria-label="Toggle count display"
      >
        {showCounts ? '🙈 Hide Counts' : '👁 Show Counts'}
      </button>
    </div>
  )
}

export default BankrollDisplay
