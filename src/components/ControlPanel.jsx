import { useContext, useState } from 'react'
import { GameContext } from '../context/GameContext'
import { getSessions } from '../utils/persistence'

const ControlPanel = () => {
  const {
    bankroll, currentBet, setCurrentBet, gameStatus,
    dealInitialCards, playerHit, playerStand, playerDouble,
    resetGame, loadSavedState,
  } = useContext(GameContext)

  const [betInput, setBetInput] = useState(10)
  const [showLoadMenu, setShowLoadMenu] = useState(false)
  const [savedSessions, setSavedSessions] = useState([])

  const isBetting = gameStatus === 'betting'
  const isPlaying = gameStatus === 'playing'

  // ---- Betting ----
  const handlePlaceBet = () => {
    if (!isBetting) return
    const amount = Math.max(1, Math.min(betInput, bankroll))
    setCurrentBet(amount)
  }

  const handleDeal = () => {
    if (!isBetting) return
    const bet = currentBet > 0 ? currentBet : Math.max(1, Math.min(betInput, bankroll))
    dealInitialCards(bet)
  }

  // ---- Load game ----
  const handleShowLoad = () => {
    setSavedSessions(getSessions())
    setShowLoadMenu(true)
  }

  const handleLoadSession = (session) => {
    loadSavedState(session)
    setShowLoadMenu(false)
  }

  const handleFileImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const state = JSON.parse(ev.target.result)
        loadSavedState(state)
        setShowLoadMenu(false)
      } catch (err) {
        alert('Failed to load: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{
      backgroundColor: '#2d5a3f',
      borderRadius: 12, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#fff', fontSize: 18, margin: 0 }}>Controls</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <SmallBtn onClick={handleShowLoad} color="#9b59b6">Load Game</SmallBtn>
          <SmallBtn onClick={resetGame} color="#e74c3c">Full Reset</SmallBtn>
        </div>
      </div>

      {/* Load menu */}
      {showLoadMenu && (
        <LoadMenu
          sessions={savedSessions}
          onLoad={handleLoadSession}
          onImport={handleFileImport}
          onClose={() => setShowLoadMenu(false)}
        />
      )}

      {/* Bet controls */}
      {isBetting && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ color: '#fff', fontSize: 14 }}>Bet $</label>
          <input
            type="number"
            value={betInput}
            onChange={e => setBetInput(Number(e.target.value))}
            min={1} max={bankroll}
            style={{
              padding: '6px 10px', borderRadius: 4, border: 'none',
              backgroundColor: '#fff', color: '#333', width: 80, fontSize: 14,
            }}
          />
          <ActionBtn onClick={handlePlaceBet} color="#4ecdc4" enabled>
            Set Bet
          </ActionBtn>
          <ActionBtn onClick={handleDeal} color="#27ae60" enabled={currentBet > 0 || betInput > 0}>
            Deal
          </ActionBtn>
        </div>
      )}

      {/* Game controls */}
      {isPlaying && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ActionBtn onClick={playerHit} color="#4ecdc4" enabled>
            Hit
          </ActionBtn>
          <ActionBtn onClick={playerStand} color="#e67e22" enabled>
            Stand
          </ActionBtn>
          <ActionBtn onClick={playerDouble} color="#3498db" enabled={currentBet <= bankroll}>
            Double
          </ActionBtn>
          <ActionBtn onClick={() => alert('Split coming soon!')} color="#9b59b6" enabled={false}>
            Split
          </ActionBtn>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components (kept local — only used here)
// ---------------------------------------------------------------------------

const ActionBtn = ({ onClick, color, enabled = true, children }) => (
  <button
    onClick={onClick}
    disabled={!enabled}
    style={{
      padding: '8px 16px',
      backgroundColor: enabled ? color : '#666',
      color: '#fff', border: 'none', borderRadius: 4,
      cursor: enabled ? 'pointer' : 'not-allowed',
      fontSize: 14, fontWeight: 'bold',
    }}
  >
    {children}
  </button>
)

const SmallBtn = ({ onClick, color, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 10px',
      backgroundColor: color, color: '#fff',
      border: 'none', borderRadius: 4,
      cursor: 'pointer', fontSize: 12,
    }}
  >
    {children}
  </button>
)

const LoadMenu = ({ sessions, onLoad, onImport, onClose }) => (
  <div style={{
    backgroundColor: '#3d7a57', borderRadius: 8, padding: 12,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ color: '#fff', fontSize: 14 }}>Saved Games:</span>
      <SmallBtn onClick={onClose} color="#666">Close</SmallBtn>
    </div>

    {sessions.length === 0
      ? <p style={{ color: '#ccc', fontSize: 12 }}>No saved games found.</p>
      : sessions.map(s => (
        <button
          key={s.id}
          onClick={() => onLoad(s)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '6px 10px', marginBottom: 4,
            backgroundColor: '#4ecdc4', color: '#fff',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12,
          }}
        >
          {s.timestamp ? new Date(s.timestamp).toLocaleString() : 'Unknown'}
        </button>
      ))
    }

    <div style={{
      marginTop: 8, padding: 8, backgroundColor: '#2d3436', borderRadius: 4,
    }}>
      <label style={{ color: '#fff', fontSize: 12, display: 'block', marginBottom: 4 }}>
        Import from file:
      </label>
      <input type="file" accept=".json" onChange={onImport} style={{ fontSize: 12 }} />
    </div>
  </div>
)

export default ControlPanel
