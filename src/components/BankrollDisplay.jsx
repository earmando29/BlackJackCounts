import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

const BankrollDisplay = () => {
  const {
    bankroll, runningCount, trueCount, cards, totalBuyIn,
    showCounts, setShowCounts, hands, numSpots,
    gameStatus, rebuy, sessionEV, handHistory,
  } = useContext(GameContext)

  const countColor = runningCount > 0 ? '#ff6b6b' : runningCount < 0 ? '#4ecdc4' : '#fff'
  const totalBet = hands.slice(0, numSpots).reduce((s, h) => s + h.bet, 0)
  const realPL = bankroll - totalBuyIn
  const variance = realPL - sessionEV
  const handsPlayed = handHistory.length

  return (
    <div style={{
      backgroundColor: '#2d5a3f',
      borderRadius: 12, padding: '10px 20px',
      display: 'flex', flexDirection: 'column', gap: 8,
      marginBottom: 12,
    }}>
      {/* Top row — bankroll + bet */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 10,
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

      {/* EV vs Real P/L bar — shows after at least 1 hand */}
      {handsPlayed > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 8,
          padding: '6px 12px',
          backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8,
        }}>
          <StatBlock
            label="Real P/L"
            value={realPL}
            tooltip="Your actual win/loss this session"
          />
          <StatBlock
            label="EV Profit"
            value={sessionEV}
            tooltip="Expected profit from optimal play"
          />
          <VarianceBlock variance={variance} />
          <span style={{ color: '#888', fontSize: 10 }}>
            {handsPlayed} hand{handsPlayed !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}

/** Displays a labeled dollar amount with color coding. */
const StatBlock = ({ label, value, tooltip }) => {
  const color = value > 0 ? '#2ecc71' : value < 0 ? '#e74c3c' : '#f1c40f'
  const sign = value >= 0 ? '+' : ''
  return (
    <div title={tooltip} style={{ textAlign: 'center' }}>
      <div style={{ color: '#aaa', fontSize: 10 }}>{label}</div>
      <div style={{ color, fontSize: 15, fontWeight: 'bold' }}>
        {sign}${value.toFixed(2)}
      </div>
    </div>
  )
}

/** Shows variance with a contextual message. */
const VarianceBlock = ({ variance }) => {
  let icon, msg, color
  if (Math.abs(variance) < 5) {
    icon = '⚖️'; msg = 'On track'; color = '#f1c40f'
  } else if (variance > 0) {
    icon = '🍀'; msg = 'Running hot'; color = '#2ecc71'
  } else {
    icon = '🌧️'; msg = 'Variance dip'; color = '#e74c3c'
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#aaa', fontSize: 10 }}>Variance</div>
      <div style={{ color, fontSize: 12, fontWeight: 'bold' }}>
        {icon} {msg}
      </div>
      <div style={{ color: '#888', fontSize: 10 }}>
        ({variance >= 0 ? '+' : ''}{variance.toFixed(2)})
      </div>
    </div>
  )
}

export default BankrollDisplay
