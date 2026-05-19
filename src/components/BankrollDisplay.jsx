import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

const BankrollDisplay = () => {
  const {
    bankroll, runningCount, trueCount, cards, totalBuyIn,
    showCounts, setShowCounts, hands, numSpots,
    gameStatus, rebuy,
  } = useContext(GameContext)

  const countColor = runningCount > 0 ? '#ff6b6b' : runningCount < 0 ? '#4ecdc4' : '#fff'
  const totalBet = hands.slice(0, numSpots).reduce((s, h) => s + h.bet, 0)
  const netPL = bankroll - totalBuyIn

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

      <div>
        <span style={{ color: '#aaa', fontSize: 11 }}>Buy-in: </span>
        <span style={{ color: '#ccc', fontSize: 14 }}>${totalBuyIn}</span>
        <span style={{
          color: netPL >= 0 ? '#2ecc71' : '#e74c3c',
          fontSize: 13, marginLeft: 6,
        }}>
          ({netPL >= 0 ? '+' : ''}{netPL.toFixed(0)})
        </span>
      </div>

      {totalBet > 0 && (
        <div>
          <span style={{ color: '#aaa', fontSize: 13 }}>Bet: </span>
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

      <div style={{ display: 'flex', gap: 6 }}>
        {gameStatus === 'betting' && bankroll < 100 && (
          <button
            onClick={() => rebuy(1000)}
            style={{
              padding: '4px 10px',
              backgroundColor: '#2ecc71', color: '#fff',
              border: 'none', borderRadius: 4,
              cursor: 'pointer', fontSize: 11, fontWeight: 'bold',
            }}
          >
            💰 Rebuy $1000
          </button>
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
    </div>
  )
}

export default BankrollDisplay
