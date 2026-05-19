/**
 * Persistence Utility for BlackJackCounts
 *
 * Flat-state localStorage persistence.
 * State shape: { cards, playerHand, dealerHand, bankroll, currentBet,
 *                runningCount, gameStatus }
 */

const KEYS = {
  GAME_STATE: 'blackjack_game_state',
  SESSIONS: 'blackjack_sessions',
}

/**
 * Save current game state to localStorage.
 * Only plain data — no methods, no circular refs.
 */
export const saveGameState = (state) => {
  try {
    const payload = { ...state, timestamp: new Date().toISOString() }
    localStorage.setItem(KEYS.GAME_STATE, JSON.stringify(payload))
    return true
  } catch (err) {
    console.error('[Persistence] save failed:', err)
    return false
  }
}

/** Load game state from localStorage (returns null if nothing saved). */
export const loadGameState = () => {
  try {
    const raw = localStorage.getItem(KEYS.GAME_STATE)
    if (!raw) return null
    const state = JSON.parse(raw)
    return (state && typeof state === 'object') ? state : null
  } catch (err) {
    console.error('[Persistence] load failed:', err)
    return null
  }
}

/** Clear saved game state. */
export const clearGameState = () => {
  try { localStorage.removeItem(KEYS.GAME_STATE); return true }
  catch { return false }
}

// ---------------------------------------------------------------------------
// Session management (save-slots)
// ---------------------------------------------------------------------------

export const getSessions = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SESSIONS) || '[]')
  } catch { return [] }
}

export const saveSession = (state) => {
  try {
    const sessions = getSessions()
    sessions.push({ ...state, id: Date.now().toString(), timestamp: new Date().toISOString() })
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions))
    return true
  } catch { return false }
}

export const deleteSession = (id) => {
  try {
    const sessions = getSessions().filter(s => s.id !== id)
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions))
    return true
  } catch { return false }
}

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

export const exportGameState = (state) => {
  try {
    const blob = new Blob(
      [JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blackjack-save-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    return true
  } catch (err) {
    console.error('[Persistence] export failed:', err)
    return false
  }
}
