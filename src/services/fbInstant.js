/**
 * Facebook Instant Games SDK Service
 * Handles FB Instant SDK initialization and game-specific functions
 */

let fbInstant = null
let isInitialized = false
let playerId = null
let playerContext = null
let gameSessionId = null

function getFBInstantGlobal() {
  return globalThis.FBInstant ?? null
}

async function setLandscapeOrientation() {
  if (!fbInstant || typeof fbInstant.setOrientation !== 'function') {
    return false
  }

  try {
    await fbInstant.setOrientation('LANDSCAPE')
    console.log('[FB Instant] Landscape orientation set')
    return true
  } catch (error) {
    console.warn('[FB Instant] Failed to set landscape orientation:', error)
    return false
  }
}

/**
 * Initialize the Facebook Instant Games SDK
 * This should be called after the FB Instant script is loaded
 * @returns {Promise<boolean>} - True if initialization was successful
 */
export async function initFBInstant() {
  if (isInitialized) {
    console.log('[FB Instant] Already initialized')
    return true
  }

  try {
    // Wait for FB Instant to be available
    const sdk = getFBInstantGlobal()
    if (!sdk) {
      console.error('[FB Instant] FBInstant is not defined. Make sure the SDK script is loaded in index.html')
      return false
    }

    fbInstant = sdk

    // Initialize the SDK
    console.log('[FB Instant] Initializing SDK...')
    await fbInstant.initializeAsync()
    console.log('[FB Instant] SDK initialized successfully')

    await setLandscapeOrientation()

    // Get player context (for multiplayer)
    try {
      playerContext = await fbInstant.getContextAsync()
      console.log('[FB Instant] Context loaded:', playerContext ? 'Available' : 'Not available')
    } catch (contextError) {
      console.warn('[FB Instant] No context available:', contextError.message)
      playerContext = null
    }

    // Get player ID if available
    try {
      playerId = fbInstant.player.getID()
      if (playerId) {
        console.log('[FB Instant] Player ID:', playerId)
      }
    } catch (playerError) {
      console.warn('[FB Instant] Player ID not available:', playerError.message)
      playerId = null
    }

    isInitialized = true
    return true
  } catch (error) {
    console.error('[FB Instant] Initialization failed:', error)
    return false
  }
}

/**
 * Check if FB Instant SDK is initialized
 * @returns {boolean}
 */
export function isFBInstantInitialized() {
  return isInitialized && fbInstant !== null
}

/**
 * Get the FB Instant SDK instance
 * @returns {Object|null} - FBInstant object or null if not initialized
 */
export function getFBInstant() {
  return fbInstant
}

/**
 * Get the player context (for multiplayer games)
 * @returns {Promise<Object|null>} - Context object or null
 */
export async function getContext() {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return null
  }
  
  if (!playerContext) {
    console.warn('[FB Instant] No context available')
    return null
  }
  
  return playerContext
}

/**
 * Get the player's ID
 * @returns {string|null} - Player ID or null
 */
export function getPlayerId() {
  return playerId
}

/**
 * Set loading progress (0-100)
 * @param {number} progress - Loading progress percentage
 */
export function setLoadingProgress(progress) {
  if (fbInstant && isInitialized) {
    fbInstant.setLoadingProgress(progress)
  }
}

/**
 * Finish loading and start the game
 * Call this after the app has mounted and the first frame is ready.
 */
export async function startGameAsync() {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized, starting game anyway')
    return
  }
  try {
    await fbInstant.setLoadingProgress(100)
    await fbInstant.startGameAsync()
    console.log('[FB Instant] Game started')
  } catch (error) {
    console.error('[FB Instant] Failed to start game:', error)
  }
}

/**
 * Share the game
 * @param {Object} payload - Share payload with template and data
 * @example
 * await shareAsync({
 *   intent: 'REQUEST',
 *   template: 'SHARE_TEMPLATE',
 *   data: { score: 1000 }
 * })
 */
export async function shareAsync(payload) {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return
  }
  try {
    await fbInstant.shareAsync(payload)
    console.log('[FB Instant] Shared successfully')
    return { success: true }
  } catch (error) {
    console.error('[FB Instant] Share failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Switch to a different context (for multiplayer)
 * @param {string} contextId - The context ID to switch to
 */
export async function switchContextAsync(contextId) {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return
  }
  try {
    await fbInstant.switchContextAsync(contextId)
    console.log('[FB Instant] Context switched')
    return { success: true }
  } catch (error) {
    console.error('[FB Instant] Failed to switch context:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Open another Instant Game by app ID (required inside the FB IG WebView; plain links often do nothing).
 * @param {string} targetAppId - Instant Game app ID to switch to
 * @param {string} [optionalPayload] - Optional string passed to the target game
 * @returns {Promise<{ success: boolean, error?: string, code?: string }>}
 */
export async function switchGameAsync(targetAppId, optionalPayload) {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return { success: false, error: 'not_initialized', code: 'NOT_INITIALIZED' }
  }
  if (typeof fbInstant.switchGameAsync !== 'function') {
    console.warn('[FB Instant] switchGameAsync is not available in this SDK')
    return { success: false, error: 'unsupported', code: 'UNSUPPORTED' }
  }
  try {
    if (optionalPayload !== undefined && optionalPayload !== null) {
      await fbInstant.switchGameAsync(targetAppId, optionalPayload)
    } else {
      await fbInstant.switchGameAsync(targetAppId)
    }
    console.log('[FB Instant] Switched to game:', targetAppId)
    return { success: true }
  } catch (error) {
    const errorCode = typeof error?.code === 'string' ? error.code : undefined
    const errorMessage = typeof error?.message === 'string' ? error.message : String(error)
    console.error('[FB Instant] Failed to switch game:', error)
    if (errorCode === 'INVALID_PARAM') {
      console.warn(
        '[FB Instant] Cross-game switch needs the target Instant Game in the same Meta Business as this app (Business Settings). Trying top-level navigation to the play URL instead.'
      )
    }
    return { success: false, error: errorMessage, code: errorCode }
  }
}

/**
 * Instant Game iframes block window.open (no allow-popups). After switchGameAsync fails, assigning the
 * play URL on the top window may still navigate on a user gesture (behavior depends on the host).
 * @param {string} playUrl - e.g. https://fb.gg/play/{appId}
 * @returns {{ success: boolean, error?: string }}
 */
export function tryNavigatePlayUrlViaTopWindow(playUrl) {
  if (typeof playUrl !== 'string' || !playUrl.startsWith('https://')) {
    return { success: false, error: 'invalid_url' }
  }
  try {
    const topWindow = globalThis.top
    if (!topWindow || topWindow === globalThis.self) {
      return { success: false, error: 'no_parent_frame' }
    }
    topWindow.location.assign(playUrl)
    return { success: true }
  } catch (navigationError) {
    const message =
      typeof navigationError?.message === 'string' ? navigationError.message : String(navigationError)
    console.warn('[FB Instant] Top-level navigation to play URL was blocked:', message)
    return { success: false, error: message }
  }
}

/**
 * Quit the game
 */
export async function quitAsync() {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return
  }
  try {
    await fbInstant.quitAsync()
    console.log('[FB Instant] Game quit')
  } catch (error) {
    console.error('[FB Instant] Failed to quit:', error)
  }
}

/**
 * Log an event for analytics
 * @param {string} eventName - Name of the event
 * @param {Object} value - Value to log
 */
export function logEvent(eventName, value) {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return
  }
  try {
    fbInstant.logEvent(eventName, value)
  } catch (error) {
    console.error('[FB Instant] Failed to log event:', error)
  }
}

/**
 * Get player data (persistent storage)
 * @param {string[]} keys - Array of keys to retrieve
 * @returns {Promise<Object>} - Player data object
 */
export async function getPlayerData(keys = []) {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return {}
  }
  try {
    const data = await fbInstant.player.getDataAsync(keys)
    console.log('[FB Instant] Player data loaded:', data)
    return data
  } catch (error) {
    console.error('[FB Instant] Failed to get player data:', error)
    return {}
  }
}

/**
 * Set player data (persistent storage)
 * @param {Object} data - Data object to store
 * @returns {Promise<void>}
 */
export async function setPlayerData(data) {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return
  }
  try {
    await fbInstant.player.setDataAsync(data)
    console.log('[FB Instant] Player data saved')
    return { success: true }
  } catch (error) {
    console.error('[FB Instant] Failed to set player data:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Flush player data to ensure it's saved
 */
export async function flushPlayerData() {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return
  }
  try {
    await fbInstant.player.flushDataAsync()
    console.log('[FB Instant] Player data flushed')
  } catch (error) {
    console.error('[FB Instant] Failed to flush player data:', error)
  }
}

/**
 * Get context data (shared data for multiplayer)
 * @param {string[]} keys - Array of keys to retrieve
 * @returns {Promise<Object>} - Context data object
 */
export async function getContextData(keys = []) {
  if (!isInitialized || !playerContext) {
    console.warn('[FB Instant] SDK not initialized or no context')
    return {}
  }
  try {
    const data = await playerContext.getDataAsync(keys)
    console.log('[FB Instant] Context data loaded:', data)
    return data
  } catch (error) {
    console.error('[FB Instant] Failed to get context data:', error)
    return {}
  }
}

/**
 * Set context data (shared data for multiplayer)
 * @param {Object} data - Data object to store
 * @returns {Promise<void>}
 */
export async function setContextData(data) {
  if (!isInitialized || !playerContext) {
    console.warn('[FB Instant] SDK not initialized or no context')
    return
  }
  try {
    await playerContext.setDataAsync(data)
    console.log('[FB Instant] Context data saved')
    return { success: true }
  } catch (error) {
    console.error('[FB Instant] Failed to set context data:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create or join a game session
 * @param {string} sessionId - Optional session ID to join
 * @returns {Promise<Object>} - Session info
 */
export async function createOrJoinGameSession(sessionId = null) {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return null
  }
  
  try {
    if (sessionId) {
      // Join existing session
      gameSessionId = sessionId
      console.log('[FB Instant] Joined session:', sessionId)
    } else {
      // Create new session
      gameSessionId = Date.now().toString()
      console.log('[FB Instant] Created session:', gameSessionId)
    }
    
    return { sessionId: gameSessionId, success: true }
  } catch (error) {
    console.error('[FB Instant] Failed to create/join session:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get current game session ID
 * @returns {string|null}
 */
export function getGameSessionId() {
  return gameSessionId
}

/**
 * Check if the game is running inside FB Instant
 * @returns {boolean}
 */
export function isRunningInFBInstant() {
  return getFBInstantGlobal() !== null
}

/**
 * Preload game resources
 * @param {string[]} resources - Array of resource URLs to preload
 */
export async function preloadResources(resources = []) {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return
  }
  
  try {
    await fbInstant.preloadResourcesAsync({ resources })
    console.log('[FB Instant] Resources preloaded:', resources)
  } catch (error) {
    console.error('[FB Instant] Failed to preload resources:', error)
  }
}

/**
 * Update the game entry point
 * @param {string} url - New entry point URL
 */
export async function updateEntryPoint(url) {
  if (!isInitialized) {
    console.warn('[FB Instant] SDK not initialized')
    return
  }
  
  try {
    await fbInstant.updateEntryPointAsync(url)
    console.log('[FB Instant] Entry point updated:', url)
  } catch (error) {
    console.error('[FB Instant] Failed to update entry point:', error)
  }
}
