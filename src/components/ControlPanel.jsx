import { useContext, useState } from 'react'
import { GameContext } from '../context/GameContext'
import { loadGameState, getSessions } from '../utils/persistence'

const ControlPanel = () => {
  const { deck, currentBet, setCurrentBet, gameStatus, resetGame, dealInitialCards, playerHit, playerStand } = useContext(GameContext)
  const [betAmount, setBetAmount] = useState(10)
  const [showLoadMenu, setShowLoadMenu] = useState(false)
  const [savedSessions, setSavedSessions] = useState([])
  
  // Load saved sessions when showing load menu
  const refreshSessions = () => {
    const sessions = getSessions()
    setSavedSessions(sessions)
  }
  
  // Load game from saved session
  const handleLoadGame = (session) => {
    if (session) {
      // Reset current game state
      resetGame()
      
      // Load saved state
      const savedState = session
      if (savedState) {
        // Restore game state
        const { deck: savedDeck, playerHand: savedPlayerHand, dealerHand: savedDealerHand, gameStatus: savedGameStatus, currentBet: savedCurrentBet } = savedState
        
        setDeck(savedDeck)
        setPlayerHand(savedPlayerHand)
        setDealerHand(savedDealerHand)
        setGameStatus(savedGameStatus)
        setCurrentBet(savedCurrentBet)
        
        setShowLoadMenu(false)
        setSavedSessions([])
      }
    }
  }
  
  // Handle file import
  const handleFileImport = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const state = JSON.parse(e.target.result)
          // Reset current game state
          resetGame()
          
          // Restore game state
          const { deck: savedDeck, playerHand: savedPlayerHand, dealerHand: savedDealerHand, gameStatus: savedGameStatus, currentBet: savedCurrentBet } = state
          
          setDeck(savedDeck)
          setPlayerHand(savedPlayerHand)
          setDealerHand(savedDealerHand)
          setGameStatus(savedGameStatus)
          setCurrentBet(savedCurrentBet)
          
          alert('Game loaded successfully!')
        } catch (error) {
          alert('Failed to load game: ' + error.message)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleBet = () => {
    if (gameStatus === 'betting') {
      setCurrentBet(betAmount)
    }
  }

  const handleClearBet = () => {
    if (gameStatus === 'betting') {
      setCurrentBet(0)
    }
  }

  const handleDeal = () => {
    if (gameStatus === 'betting') {
      dealInitialCards()
    }
  }

  const handleStand = () => {
    if (gameStatus === 'playing') {
      playerStand()
    }
  }

  const handleHit = () => {
    if (gameStatus === 'playing') {
      playerHit()
    }
  }

  const handleDouble = () => {
    if (gameStatus === 'playing' && currentBet > 0) {
      // Double down - double the bet and get one more card
      const newDeck = { ...deck }
      const card = drawCard(newDeck)
      
      if (card.card) {
        setDeck(prev => ({
          ...prev,
          bankroll: prev.bankroll - currentBet,
          deck: newDeck.deck
        }))
        setPlayerHand(prev => [...prev, card.card])
        setCurrentBet(0)
      }
    }
  }

  const handleSplit = () => {
    if (gameStatus === 'playing') {
      // Split logic would go here
      alert('Split functionality coming soon!')
    }
  }

  const handleInsurance = () => {
    if (gameStatus === 'playing' && deck.deck[0].rank === 'A') {
      // Insurance - bet half of current bet on dealer having blackjack
      const insuranceBet = currentBet / 2
      if (deck.bankroll >= insuranceBet) {
        setCurrentBet(prev => prev + insuranceBet)
        alert(`Insurance bet of $${insuranceBet} placed!`)
      }
    }
  }

  return (
    <div style={{
      backgroundColor: '#2d5a3f',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#fff', fontSize: '18px' }}>Controls</h3>
        <span style={{ color: '#4ecdc4', fontSize: '14px' }}>
          Bankroll: ${deck.bankroll.toFixed(2)}
        </span>
        <button
          onClick={() => {
            refreshSessions()
            setShowLoadMenu(true)
          }}
          style={{
            padding: '6px 10px',
            backgroundColor: '#9b59b6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Load Game
        </button>
      </div>
      
      {/* Load Game Menu */}
      {showLoadMenu && (
        <div style={{
          backgroundColor: '#3d7a57',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#fff', fontSize: '14px' }}>Saved Games:</span>
            <button
              onClick={() => setShowLoadMenu(false)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#666',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Close
            </button>
          </div>
          
          {savedSessions.length === 0 ? (
            <p style={{ color: '#ccc', fontSize: '12px' }}>No saved games found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {savedSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => handleLoadGame(session)}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: '#4ecdc4',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left'
                  }}
                >
                  {session.timestamp ? new Date(session.timestamp).toLocaleString() : 'Unknown'}
                </button>
              ))}
            </div>
          )}
          
          <div style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#2d3436',
            borderRadius: '4px'
          }}>
            <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Or import from file:
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              style={{
                fontSize: '12px',
                padding: '4px'
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={handleBet}
          disabled={gameStatus !== 'betting'}
          style={{
            padding: '8px 12px',
            backgroundColor: gameStatus === 'betting' ? '#4ecdc4' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: gameStatus === 'betting' ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Bet ${betAmount}
        </button>

        <button
          onClick={handleClearBet}
          disabled={gameStatus !== 'betting'}
          style={{
            padding: '8px 12px',
            backgroundColor: gameStatus === 'betting' ? '#ff6b6b' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: gameStatus === 'betting' ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Clear Bet
        </button>

        <button
          onClick={handleDeal}
          disabled={gameStatus !== 'betting'}
          style={{
            padding: '8px 12px',
            backgroundColor: gameStatus === 'betting' ? '#4ecdc4' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: gameStatus === 'betting' ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Deal
        </button>

        <button
          onClick={handleHit}
          disabled={gameStatus !== 'playing'}
          style={{
            padding: '8px 12px',
            backgroundColor: gameStatus === 'playing' ? '#4ecdc4' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: gameStatus === 'playing' ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Hit
        </button>

        <button
          onClick={handleStand}
          disabled={gameStatus !== 'playing'}
          style={{
            padding: '8px 12px',
            backgroundColor: gameStatus === 'playing' ? '#ff6b6b' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: gameStatus === 'playing' ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Stand
        </button>

        <button
          onClick={handleDouble}
          disabled={gameStatus !== 'playing'}
          style={{
            padding: '8px 12px',
            backgroundColor: gameStatus === 'playing' ? '#4ecdc4' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: gameStatus === 'playing' ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Double
        </button>

        <button
          onClick={handleSplit}
          disabled={gameStatus !== 'playing'}
          style={{
            padding: '8px 12px',
            backgroundColor: gameStatus === 'playing' ? '#4ecdc4' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: gameStatus === 'playing' ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Split
        </button>

        <button
          onClick={handleInsurance}
          disabled={gameStatus !== 'playing' || deck.deck[0].rank !== 'A'}
          style={{
            padding: '8px 12px',
            backgroundColor: gameStatus === 'playing' && deck.deck[0].rank === 'A' ? '#ff6b6b' : '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: (gameStatus === 'playing' && deck.deck[0].rank === 'A') ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Insurance
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <label style={{ color: '#fff', fontSize: '14px' }}>Bet Amount:</label>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          min={1}
          max={deck.bankroll}
          style={{
            padding: '6px 10px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#fff',
            color: '#333',
            width: '80px',
            fontSize: '14px'
          }}
        />
      </div>
    </div>
  )
}

export default ControlPanel
