import bfIconPath from '../assets/icons/bf_icon.png'

const API_ORIGIN = 'https://docking-635955947416.asia-east1.run.app'
const GAMES_URL = import.meta.env.DEV ? '/api/games/' : `${API_ORIGIN}/api/games/`

export const CURRENT_GAME_NAME = 'Bingo Fiesta'
export const FALLBACK_GAME_ID = '4'
export const FALLBACK_CURRENT_GAME = {
  game_id: FALLBACK_GAME_ID,
  name: CURRENT_GAME_NAME,
  slug: 'bingo-fiesta',
  game_url: null,
  image_url: bfIconPath,
}

let cachedGameId = null
let cachedGameCatalog = null

function normalizeGameName(name) {
  return String(name ?? '').trim().toLowerCase()
}

function getGamesFromPayload(payload) {
  const games = payload?.data?.games
  return Array.isArray(games) ? games : []
}

function getFeaturedGamesFromPayload(payload) {
  const featuredGames = payload?.data?.featured_games
  return Array.isArray(featuredGames) ? featuredGames : []
}

function findCurrentGame(games) {
  return games.find((game) => normalizeGameName(game?.name) === normalizeGameName(CURRENT_GAME_NAME)) ?? null
}

export async function fetchGameCatalog() {
  const response = await fetch(GAMES_URL)

  if (!response.ok) {
    throw new Error(`Games request failed (${response.status})`)
  }

  const payload = await response.json()
  const games = getGamesFromPayload(payload)
  const featuredGames = getFeaturedGamesFromPayload(payload)
  const currentGame = findCurrentGame(games) ?? FALLBACK_CURRENT_GAME

  return {
    games,
    featuredGames,
    currentGame,
  }
}

export async function getGameCatalog() {
  if (cachedGameCatalog) {
    return cachedGameCatalog
  }

  cachedGameCatalog = await fetchGameCatalog()
  return cachedGameCatalog
}

export async function resolveCurrentGameId() {
  if (cachedGameId) {
    return cachedGameId
  }

  const { currentGame } = await getGameCatalog()

  if (!currentGame?.game_id) {
    throw new Error(`Game "${CURRENT_GAME_NAME}" was not found`)
  }

  cachedGameId = String(currentGame.game_id)
  return cachedGameId
}

export async function getCurrentGameRecord() {
  const { currentGame } = await getGameCatalog()
  return currentGame ?? FALLBACK_CURRENT_GAME
}

export async function getCurrentGameId() {
  try {
    return await resolveCurrentGameId()
  } catch (error) {
    console.warn('[gameCatalogApi] Using fallback game id.', error)
    return FALLBACK_GAME_ID
  }
}
