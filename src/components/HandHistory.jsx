import { useContext, useState } from 'react'
import { GameContext } from '../context/GameContext'

const HandHistory = () => {
  const { handHistory, viewHistoryRound, reviewingRound } = useContext(GameContext)
  const [expanded, setExpanded] = useState(false)

  if (handHistory.length === 0) return null

  return (
    <div style={{
      backgroundColor: '#2d5a3f', borderRadius: 12,
      padding: 12, marginBottom: 12,
    }}>
      <button
        onClick={() => setExpanded(p => !p)}
        style={{
          width: '100%', padding: '6px 12px',
          backgroundColor: 'transparent', color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 6, cursor: 'pointer',
          fontSize: 13, fontWeight: 'bold',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>📋 Hand History ({handHistory.length})</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{
          marginTop: 8, maxHeight: 260, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {[...handHistory].reverse().map((round, i) => {
            const actualIdx = handHistory.length - 1 - i
            const isReviewing = reviewingRound?.handNumber === round.handNumber
            const netColor = round.roundNet > 0 ? '#2ecc71'
              : round.roundNet < 0 ? '#e74c3c' : '#f1c40f'
            const handCount = round.playerHands.length
            const totalBet = round.playerHands.reduce((s, h) => s + h.bet, 0)

            return (
              <button
                key={round.handNumber}
                onClick={() => viewHistoryRound(actualIdx)}
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '6px 10px',
                  backgroundColor: isReviewing ? '#4ecdc4' : 'rgba(0,0,0,0.2)',
                  color: '#fff', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontSize: 12,
                  transition: 'background-color 0.15s',
                }}
              >
                <span style={{ color: '#aaa' }}>
                  #{round.handNumber}
                  {handCount > 1 && ` (${handCount} hands)`}
                </span>
                <span style={{ color: '#aaa' }}>
                  Bet: ${totalBet}
                </span>
                <span style={{ color: netColor, fontWeight: 'bold' }}>
                  {round.roundNet >= 0 ? '+' : ''}${round.roundNet.toFixed(0)}
                </span>
                <span style={{ color: '#888', fontSize: 10 }}>
                  RC:{round.runningCount}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HandHistory
