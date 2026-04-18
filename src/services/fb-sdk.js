/**
 * Facebook SDK Core Service
 * Handles base Facebook SDK initialization and utilities
 */

let fbSdk = null
let isInitialized = false
let appId = null

/**
 * Initialize the base Facebook SDK
 * @param {string} fbAppId - Your Facebook App ID
 * @returns {Promise<boolean>} - True if initialization was successful
 */
export async function initFBSDK(fbAppId) {
  if (isInitialized) {
    console.log('[FB SDK] Already initialized')
    return true
  }

  return new Promise((resolve) => {
    // Check if FB SDK is loaded
    if (typeof FB === 'undefined') {
      console.warn('[FB SDK] FB SDK not loaded, skipping initialization')
      resolve(false)
      return
    }

    fbSdk = FB

    // Initialize FB SDK
    fbSdk.init({
      appId: fbAppId,
      xfbml: true,
      version: 'v18.0'
    })

    console.log('[FB SDK] SDK initialized with App ID:', fbAppId)
    appId = fbAppId
    isInitialized = true
    resolve(true)
  })
}

/**
 * Check if FB SDK is initialized
 * @returns {boolean}
 */
export function isFBSDKInitialized() {
  return isInitialized && fbSdk !== null
}

/**
 * Get the FB SDK instance
 * @returns {Object|null} - FB object or null if not initialized
 */
export function getFBSDK() {
  return fbSdk
}

/**
 * Get Facebook login status
 * @returns {Promise<Object>} - Login status response
 */
export async function getLoginStatus() {
  if (!isInitialized) {
    console.warn('[FB SDK] SDK not initialized')
    return { status: 'unknown' }
  }

  return new Promise((resolve) => {
    fbSdk.getLoginStatus((response) => {
      console.log('[FB SDK] Login status:', response.status)
      resolve(response)
    })
  })
}

/**
 * Login with Facebook
 * @param {Object} options - Login options
 * @returns {Promise<Object>} - Login response
 */
export async function login(options = {}) {
  if (!isInitialized) {
    console.warn('[FB SDK] SDK not initialized')
    return null
  }

  return new Promise((resolve) => {
    fbSdk.login((response) => {
      if (response.authResponse) {
        console.log('[FB SDK] Login successful')
        resolve(response)
      } else {
        console.warn('[FB SDK] Login cancelled or failed')
        resolve(null)
      }
    }, options)
  })
}

/**
 * Logout from Facebook
 */
export async function logout() {
  if (!isInitialized) {
    console.warn('[FB SDK] SDK not initialized')
    return
  }

  return new Promise((resolve) => {
    fbSdk.logout((response) => {
      console.log('[FB SDK] Logout complete')
      resolve(response)
    })
  })
}

/**
 * Get user profile
 * @returns {Promise<Object>} - User profile data
 */
export async function getUserProfile() {
  if (!isInitialized) {
    console.warn('[FB SDK] SDK not initialized')
    return null
  }

  return new Promise((resolve, reject) => {
    fbSdk.api('/me', { fields: 'id,name,picture' }, (response) => {
      if (response && !response.error) {
        console.log('[FB SDK] User profile loaded')
        resolve(response)
      } else {
        console.error('[FB SDK] Failed to get user profile:', response.error)
        reject(response.error)
      }
    })
  })
}

/**
 * Share on Facebook
 * @param {Object} shareData - Share data (href, quote, hashtag)
 * @returns {Promise<Object>} - Share response
 */
export async function share(shareData) {
  if (!isInitialized) {
    console.warn('[FB SDK] SDK not initialized')
    return null
  }

  return new Promise((resolve, reject) => {
    fbSdk.ui({
      method: 'share',
      ...shareData
    }, (response) => {
      if (response && !response.error) {
        console.log('[FB SDK] Share successful')
        resolve(response)
      } else {
        console.error('[FB SDK] Share failed:', response.error)
        reject(response.error)
      }
    })
  })
}

/**
 * Log app event for analytics
 * @param {string} eventName - Event name
 * @param {Object} parameters - Event parameters
 */
export function logEvent(eventName, parameters = {}) {
  if (!isInitialized) {
    console.warn('[FB SDK] SDK not initialized')
    return
  }

  try {
    fbSdk.AppEvents.logEvent(eventName, parameters)
    console.log('[FB SDK] Event logged:', eventName)
  } catch (error) {
    console.error('[FB SDK] Failed to log event:', error)
  }
}

/**
 * Check if running in Facebook environment
 * @returns {boolean}
 */
export function isRunningInFacebook() {
  return typeof FB !== 'undefined'
}
