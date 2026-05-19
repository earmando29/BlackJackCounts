/**
 * Persistence Utility for BlackJackCounts
 * 
 * This module provides functionality for saving and loading game state
 * to localStorage for persistence across sessions.
 * 
 * PERSISTENCE PLAN:
 * 
 * Phase 1: Basic localStorage persistence
 * - Save deck state, hands, and game status
 * - Load state on app initialization
 * - Auto-save on state changes
 * 
 * Phase 2: Enhanced persistence features
 * - Save/load multiple game sessions
 * - Export game state as JSON file
 * - Import game state from JSON file
 * - Session management (active, archived, deleted)
 * 
 * Phase 3: Advanced persistence
 * - IndexedDB for larger state storage
 * - Offline-first architecture
 * - Sync across devices (future enhancement)
 * - Backup/restore functionality
 */

// Storage keys
const STORAGE_KEYS = {
  GAME_STATE: 'blackjack_game_state',
  SESSIONS: 'blackjack_sessions',
  SETTINGS: 'blackjack_settings'
}

// Default game state structure
const DEFAULT_GAME_STATE = {
  deck: null,
  playerHand: [],
  dealerHand: [],
  gameStatus: 'betting',
  currentBet: 10,
  bankroll: 1000,
  count: 0,
  runningCount: 0,
  trueCount: 0,
  history: []
}

// Default sessions structure
const DEFAULT_SESSIONS = []

/**
 * Save current game state to localStorage
 * @param {Object} state - Game state to save
 * @returns {boolean} Success status
 */
export const saveGameState = (state) => {
  try {
    console.log('[Persistence] Saving game state:', state)
    
    // Create a serializable version of the state
    const serializableState = {
      ...DEFAULT_GAME_STATE,
      ...state,
      timestamp: new Date().toISOString()
    }
    
    // Remove methods from deck object that can't be serialized
    if (serializableState.deck) {
      const { deck, ...deckProps } = serializableState.deck
      serializableState.deck = {
        ...deckProps,
        deck: deck, // Keep the array of cards
        runningCount: deck.runningCount,
        trueCount: deck.trueCount,
        bankroll: deck.bankroll
      }
    }
    
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(serializableState))
    console.log('[Persistence] State saved successfully')
    return true
  } catch (error) {
    console.error('[Persistence] Failed to save game state:', error)
    return false
  }
}

/**
 * Load game state from localStorage
 * @returns {Object|null} Game state or null if not found
 */
export const loadGameState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GAME_STATE)
    console.log('[Persistence] Loaded from localStorage:', saved)
    
    if (saved) {
      const state = JSON.parse(saved)
      console.log('[Persistence] Parsed state:', state)
      
      // Validate state structure
      if (state && typeof state === 'object') {
        // Reconstruct deck object with proper structure
        if (state.deck) {
          state.deck = {
            deck: state.deck.deck || [],
            runningCount: state.deck.runningCount || 0,
            trueCount: state.deck.trueCount || 0,
            bankroll: state.deck.bankroll || 1000,
            shuffle: () => {
              // Re-implement shuffle logic
              const deckArray = state.deck.deck
              for (let i = deckArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                [deckArray[i], deckArray[j]] = [deckArray[j], deckArray[i]]
              }
            }
          }
        }
        console.log('[Persistence] State loaded successfully:', state)
        return state
      }
    }
    console.log('[Persistence] No saved state found')
    return null
  } catch (error) {
    console.error('[Persistence] Failed to load game state:', error)
    return null
  }
}

/**
 * Clear saved game state
 */
export const clearGameState = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE)
    console.log('[Persistence] Cleared game state')
    return true
  } catch (error) {
    console.error('[Persistence] Failed to clear game state:', error)
    return false
  }
}

/**
 * Save game session
 * @param {Object} session - Session data
 * @returns {boolean} Success status
 */
export const saveSession = (session) => {
  try {
    const sessions = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]'
    )
    
    const newSession = {
      ...session,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }
    
    sessions.push(newSession)
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
    console.log('[Persistence] Session saved:', newSession.id)
    return true
  } catch (error) {
    console.error('[Persistence] Failed to save session:', error)
    return false
  }
}

/**
 * Get all saved sessions
 * @returns {Array} Array of sessions
 */
export const getSessions = () => {
  try {
    const sessions = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]'
    )
    return sessions
  } catch (error) {
    console.error('[Persistence] Failed to get sessions:', error)
    return []
  }
}

/**
 * Get session by ID
 * @param {string} id - Session ID
 * @returns {Object|null} Session or null if not found
 */
export const getSessionById = (id) => {
  const sessions = getSessions()
  return sessions.find(s => s.id === id) || null
}

/**
 * Delete session by ID
 * @param {string} id - Session ID
 * @returns {boolean} Success status
 */
export const deleteSession = (id) => {
  try {
    const sessions = getSessions()
    const filtered = sessions.filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered))
    console.log('[Persistence] Session deleted:', id)
    return true
  } catch (error) {
    console.error('[Persistence] Failed to delete session:', error)
    return false
  }
}

/**
 * Export game state as JSON file
 * @param {Object} state - Game state to export
 * @returns {string} Download URL or error message
 */
export const exportGameState = (state) => {
  try {
    // Create a serializable version of the state
    const serializableState = {
      ...DEFAULT_GAME_STATE,
      ...state,
      exportedAt: new Date().toISOString()
    }
    
    // Remove methods from deck object that can't be serialized
    if (serializableState.deck) {
      const { deck, ...deckProps } = serializableState.deck
      serializableState.deck = {
        ...deckProps,
        deck: deck, // Keep the array of cards
        runningCount: deck.runningCount,
        trueCount: deck.trueCount,
        bankroll: deck.bankroll
      }
    }
    
    const blob = new Blob([JSON.stringify(serializableState, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blackjack-save-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    console.log('[Persistence] Export successful')
    return 'Export successful'
  } catch (error) {
    console.error('[Persistence] Failed to export game state:', error)
    return 'Export failed: ' + error.message
  }
}

/**
 * Import game state from JSON file
 * @param {File} file - JSON file to import
 * @returns {Object|null} Imported state or null if invalid
 */
export const importGameState = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target.result)
        // Validate state structure
        if (state && typeof state === 'object') {
          // Save imported state
          saveGameState(state)
          resolve(state)
        } else {
          reject(new Error('Invalid game state structure'))
        }
      } catch (error) {
        reject(new Error('Failed to parse JSON: ' + error.message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Get persistence configuration
 * @returns {Object} Current persistence settings
 */
export const getPersistenceConfig = () => {
  try {
    const config = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return config ? JSON.parse(config) : {
      autoSave: true,
      saveOnEveryChange: false,
      exportOnReset: false
    }
  } catch (error) {
    console.error('[Persistence] Failed to get persistence config:', error)
    return {
      autoSave: true,
      saveOnEveryChange: false,
      exportOnReset: false
    }
  }
}

/**
 * Set persistence configuration
 * @param {Object} config - Configuration object
 * @returns {boolean} Success status
 */
export const setPersistenceConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(config))
    return true
  } catch (error) {
    console.error('[Persistence] Failed to set persistence config:', error)
    return false
  }
}

/**
 * Clear all persistence data
 */
export const clearAllPersistence = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE)
    localStorage.removeItem(STORAGE_KEYS.SESSIONS)
    localStorage.removeItem(STORAGE_KEYS.SETTINGS)
    console.log('[Persistence] Cleared all persistence data')
    return true
  } catch (error) {
    console.error('[Persistence] Failed to clear all persistence:', error)
    return false
  }
}

export default {
  saveGameState,
  loadGameState,
  clearGameState,
  saveSession,
  getSessions,
  getSessionById,
  deleteSession,
  exportGameState,
  importGameState,
  getPersistenceConfig,
  setPersistenceConfig,
  clearAllPersistence
}
