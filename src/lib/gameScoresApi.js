const GAME_SCORES_URL =
  'https://docking-635955947416.asia-east1.run.app/api/game-score/bing-fiesta/scores'

/**
 * Fetches leaderboard rows: { phone, game_id?, points? }[].
 * Returns an empty array if the response is not usable.
 */
export async function fetchGameScores() {
  const response = await fetch(GAME_SCORES_URL)

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

  if (rawPayload && Array.isArray(rawPayload.scores)) {
    return normalizeScoreRows(rawPayload.scores)
  }

  return []
}

function normalizeScoreRows(rows) {
  return rows.filter((row) => row && typeof row.phone === 'string' && row.phone.trim().length > 0)
}

/**
 * Placeholder scores when the API is unreachable or returns nothing.
 * Ten entries with masked-style phone numbers.
 */
export function buildFakeGameScores() {
  const maskedPhoneNumbers = [
    '927-****-432',
    '916-****-312',
    '905-****-891',
    '933-****-105',
    '918-****-774',
    '939-****-228',
    '920-****-651',
    '915-****-903',
    '917-****-440',
    '922-****-188',
  ]

  return maskedPhoneNumbers.map((phone, index) => ({
    phone,
    game_id: 'bingo-fiesta',
    points: 12000 + index * 1375,
  }))
}
