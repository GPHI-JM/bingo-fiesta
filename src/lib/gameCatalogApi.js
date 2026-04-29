const API_ORIGIN = 'https://docking-635955947416.asia-east1.run.app'
const GAMES_URL = import.meta.env.DEV ? '/api/games/' : `${API_ORIGIN}/api/games/`

export const CURRENT_GAME_NAME = 'Bingo Fiesta'
export const FALLBACK_GAME_ID = '4'

let cachedGameId = null

function normalizeGameName(name) {
  return String(name ?? '').trim().toLowerCase()
}

function getGamesFromPayload(payload) {
  const games = payload?.data?.games
  return Array.isArray(games) ? games : []
}

export async function resolveCurrentGameId() {
  if (cachedGameId) {
    return cachedGameId
  }

  const response = await fetch(GAMES_URL)

  if (!response.ok) {
    throw new Error(`Games request failed (${response.status})`)
  }

  const payload = await response.json()
  const currentGame = getGamesFromPayload(payload).find(
    (game) => normalizeGameName(game?.name) === normalizeGameName(CURRENT_GAME_NAME),
  )

  if (!currentGame?.game_id) {
    throw new Error(`Game "${CURRENT_GAME_NAME}" was not found`)
  }

  cachedGameId = String(currentGame.game_id)
  return cachedGameId
}

export async function getCurrentGameId() {
  try {
    return await resolveCurrentGameId()
  } catch (error) {
    console.warn('[gameCatalogApi] Using fallback game id.', error)
    return FALLBACK_GAME_ID
  }
}
