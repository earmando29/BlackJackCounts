import { useContext, useState } from 'react'
import { GameContext } from '../context/GameContext'
import { getSessions } from '../utils/persistence'
import ChipBetting from './ChipBetting'

const ControlPanel = () => {
  const {
    bankroll, gameStatus, numSpots, setNumSpots,
    dealSpeed, setDealSpeed, dealInitialCards,
    playerHit, playerStand, playerDouble,
    resetGame, loadSavedState, hands,
  } = useContext(GameContext)

  const [showLoadMenu, setShowLoadMenu] = useState(false)
  const [savedSessions, setSavedSessions] = useState([])

  const isBetting = gameStatus === 'betting'
  const isPlaying = gameStatus === 'playing'
  const isDealing = gameStatus === 'dealing'
  const totalBets = hands.slice(0, numSpots).reduce((s, h) => s + h.bet, 0)
  const canDeal = isBetting && totalBets > 0 && totalBets <= bankroll

  // ---- Load ----
  const handleShowLoad = () => { setSavedSessions(getSessions()); setShowLoadMenu(true) }
  const handleLoadSession = (s) => { loadSavedState(s); setShowLoadMenu(false) }
  const handleFileImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try { loadSavedState(JSON.parse(ev.target.result)); setShowLoadMenu(false) }
      catch (err) { alert('Failed: ' + err.message) }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{
      backgroundColor: '#2d5a3f', borderRadius: 12, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Top row — settings + actions */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 8,
      }}>
        {/* Spots selector */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color: '#aaa', fontSize: 12 }}>Spots:</span>
          {[1, 2, 3].map(n => (
            <Pill key={n} active={numSpots === n}
              onClick={() => { if (isBetting) setNumSpots(n) }}
              disabled={!isBetting}
            >{n}</Pill>
          ))}
        </div>

        {/* Speed selector */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color: '#aaa', fontSize: 12 }}>Speed:</span>
          {[1, 2, 3, 4, 5].map(s => (
            <Pill key={s} active={dealSpeed === s}
              onClick={() => setDealSpeed(s)}
            >{s}</Pill>
          ))}
        </div>

        {/* Utility buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <SmallBtn onClick={handleShowLoad} color="#9b59b6">Load</SmallBtn>
          <SmallBtn onClick={resetGame} color="#e74c3c">Reset</SmallBtn>
        </div>
      </div>

      {/* Load menu */}
      {showLoadMenu && (
        <LoadMenu sessions={savedSessions}
          onLoad={handleLoadSession} onImport={handleFileImport}
          onClose={() => setShowLoadMenu(false)} />
      )}

      {/* Chip betting (only during betting phase) */}
      {isBetting && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          alignItems: 'center',
        }}>
          <ChipBetting />
          <ActionBtn onClick={dealInitialCards} color="#27ae60" enabled={canDeal}>
            Deal
          </ActionBtn>
        </div>
      )}

      {/* Playing controls */}
      {isPlaying && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <ActionBtn onClick={playerHit} color="#4ecdc4" enabled>Hit</ActionBtn>
          <ActionBtn onClick={playerStand} color="#e67e22" enabled>Stand</ActionBtn>
          <ActionBtn onClick={playerDouble} color="#3498db"
            enabled={hands[0]?.bet <= bankroll}>
            Double
          </ActionBtn>
        </div>
      )}

      {/* Dealing indicator */}
      {isDealing && (
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 14 }}>
          Dealing...
        </p>
      )}
    </div>
  )
}

// ---- Tiny local sub-components ----

const ActionBtn = ({ onClick, color, enabled = true, children }) => (
  <button onClick={onClick} disabled={!enabled} style={{
    padding: '10px 22px',
    backgroundColor: enabled ? color : '#555',
    color: '#fff', border: 'none', borderRadius: 6,
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: 15, fontWeight: 'bold',
  }}>{children}</button>
)

const Pill = ({ active, onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: active ? '#4ecdc4' : '#444',
    color: '#fff', border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13, fontWeight: 'bold',
    opacity: disabled ? 0.5 : 1,
  }}>{children}</button>
)

const SmallBtn = ({ onClick, color, children }) => (
  <button onClick={onClick} style={{
    padding: '4px 10px',
    backgroundColor: color, color: '#fff',
    border: 'none', borderRadius: 4,
    cursor: 'pointer', fontSize: 12,
  }}>{children}</button>
)

const LoadMenu = ({ sessions, onLoad, onImport, onClose }) => (
  <div style={{ backgroundColor: '#3d7a57', borderRadius: 8, padding: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ color: '#fff', fontSize: 14 }}>Saved Games:</span>
      <SmallBtn onClick={onClose} color="#666">Close</SmallBtn>
    </div>
    {sessions.length === 0
      ? <p style={{ color: '#ccc', fontSize: 12 }}>No saved games.</p>
      : sessions.map(s => (
        <button key={s.id} onClick={() => onLoad(s)} style={{
          display: 'block', width: '100%', textAlign: 'left',
          padding: '6px 10px', marginBottom: 4,
          backgroundColor: '#4ecdc4', color: '#fff',
          border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12,
        }}>
          {s.timestamp ? new Date(s.timestamp).toLocaleString() : 'Unknown'}
        </button>
      ))
    }
    <div style={{ marginTop: 8, padding: 8, backgroundColor: '#2d3436', borderRadius: 4 }}>
      <label style={{ color: '#fff', fontSize: 12, display: 'block', marginBottom: 4 }}>
        Import from file:
      </label>
      <input type="file" accept=".json" onChange={onImport} style={{ fontSize: 12 }} />
    </div>
  </div>
)

export default ControlPanel
