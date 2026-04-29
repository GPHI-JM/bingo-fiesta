import bfIconPath from '../assets/icons/bf_icon.png'
import { FALLBACK_GAME_ID, getCurrentGameId } from './gameCatalogApi'

const GAME_LOGIN_URL = import.meta.env.DEV
  ? '/api/auth/game-login'
  : 'https://docking-635955947416.asia-east1.run.app/api/auth/game-login'

export const GAME_LOGIN_GAME_ID = FALLBACK_GAME_ID
export const GAME_LOGIN_SECRET_KEY =
  import.meta.env.VITE_VERIFY_PHONE_SECRET ||
  'e4b7c9f1a2d34e8b9f6a1c7d0e5f2a3b4c8d9e7f6a1b2c3d4e5f6a7b8c9d0e1f'
export const GAME_LOGIN_ICON_PATH = bfIconPath

export function buildGameLoginPayload(
  phone,
  gameId = GAME_LOGIN_GAME_ID,
  gameIconPath = GAME_LOGIN_ICON_PATH,
) {
  return {
    game_id: gameId,
    phone: String(phone ?? '').trim(),
    gamesecretkey: GAME_LOGIN_SECRET_KEY,
    game_icon_path: gameIconPath,
  }
}

function createGameLoginError(responseStatus, detail) {
  const normalizedDetail = String(detail ?? '').trim()
  const isDuplicate =
    responseStatus === 409 ||
    /already\s+exist|already\s+registered|duplicate|phone\s+exists/i.test(normalizedDetail)

  const message = isDuplicate
    ? 'Mobile Number Exist'
    : normalizedDetail || `Request failed (${responseStatus})`

  const error = new Error(message)
  error.status = responseStatus
  error.code = isDuplicate ? 'PHONE_EXISTS' : 'REQUEST_FAILED'
  return error
}

function createGameLoginErrorFromResponse(responseStatus, payloadText) {
  const rawText = String(payloadText ?? '').trim()
  if (!rawText) {
    return createGameLoginError(responseStatus, '')
  }

  try {
    const payload = JSON.parse(rawText)
    const errorCode = String(payload?.errorCode ?? '').trim()
    const message = String(payload?.message ?? '').trim()

    if (errorCode === 'ERR_PHONE_ALREADY_USED') {
      const error = new Error('Mobile Number Exist')
      error.status = responseStatus
      error.code = 'PHONE_EXISTS'
      return error
    }

    return createGameLoginError(responseStatus, message || rawText)
  } catch {
    return createGameLoginError(responseStatus, rawText)
  }
}

/**
 * Registers game session after a win with the user's phone.
 */
export async function postGameLogin(phone) {
  if (import.meta.env.DEV) {
    console.debug('[gameLoginApi] POST', GAME_LOGIN_URL)
  }

  const gameId = await getCurrentGameId()
  const response = await fetch(GAME_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildGameLoginPayload(phone, gameId)),
  })

  if (!response.ok) {
    let detail = ''
    try {
      detail = await response.text()
    } catch {
      detail = ''
    }
    throw createGameLoginErrorFromResponse(response.status, detail)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return {}
}
