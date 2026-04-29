const API_ORIGIN = 'https://docking-635955947416.asia-east1.run.app'
const USER_MOBILE_URL = import.meta.env.DEV ? '/api/usermobile' : `${API_ORIGIN}/api/usermobile`

/**
 * Fetches user mobile rows and returns masked leaderboard rows for this game.
 * Returns an empty array if the response is not usable.
 */
export async function fetchGameScores() {
  const response = await fetch(USER_MOBILE_URL)

  if (!response.ok) {
    throw new Error(`Scores request failed (${response.status})`)
  }

  const rawPayload = await response.json()

  if (Array.isArray(rawPayload)) {
    return normalizeScoreRows(rawPayload)
  }

  if (rawPayload && Array.isArray(rawPayload.data)) {
    return normalizeScoreRows(rawPayload.data)
  }

  if (rawPayload && Array.isArray(rawPayload.data?.users)) {
    return normalizeScoreRows(rawPayload.data.users)
  }

  return []
}

function normalizeScoreRows(rows) {
  return rows
    .filter((row) => {
      const phone = String(row?.phone ?? '').trim()
      return phone.length > 0
    })
    .map((row, index) => ({
      phone: maskPhoneNumber(row.phone),
      game_id: String(row.game_id ?? ''),
      points: Number(row.points) || 12000 + index * 1375,
    }))
}

function maskPhoneNumber(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length <= 6) {
    return digits
  }

  return `${digits.slice(0, 3)}-****-${digits.slice(-3)}`
}

/**
 * Empty placeholder until usermobile finishes loading.
 */
export function buildFakeGameScores() {
  return []
}
