import bfIconPath from '../assets/icons/bf_icon.png'
import { FALLBACK_CURRENT_GAME, getCurrentGameRecord } from './gameCatalogApi'

const GAME_LOGIN_URL = import.meta.env.DEV
  ? '/api/auth/game-login'
  : 'https://docking-635955947416.asia-east1.run.app/api/auth/game-login'

export const GAME_LOGIN_GAME_ID = FALLBACK_CURRENT_GAME.game_id
export const GAME_LOGIN_ICON_PATH = bfIconPath

function normalizeGameId(gameId) {
  const parsed = Number(gameId)
  return Number.isFinite(parsed) ? parsed : String(gameId ?? '').trim()
}

export function buildGameLoginPayload(phone, { gameId, gameIconPath, points } = {}) {
  return {
    game_id: normalizeGameId(gameId ?? GAME_LOGIN_GAME_ID),
    phone: String(phone ?? '').trim(),
    game_icon_path: String(gameIconPath ?? GAME_LOGIN_ICON_PATH).trim(),
    points: String(points ?? '0').trim(),
    is_verified: 1,
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
export async function postGameLogin(phone, options = {}) {
  if (import.meta.env.DEV) {
    console.debug('[gameLoginApi] POST', GAME_LOGIN_URL)
  }

  const currentGame = options.gameId || options.gameIconPath || options.points
    ? {
        game_id: options.gameId ?? FALLBACK_CURRENT_GAME.game_id,
        image_url: options.gameIconPath ?? FALLBACK_CURRENT_GAME.image_url,
        points: options.points ?? '0',
      }
    : await getCurrentGameRecord()

  const response = await fetch(GAME_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      buildGameLoginPayload(phone, {
        gameId: currentGame.game_id,
        gameIconPath: currentGame.image_url,
        points: currentGame.points ?? '0',
      }),
    ),
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
