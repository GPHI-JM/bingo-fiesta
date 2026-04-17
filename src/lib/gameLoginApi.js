const GAME_LOGIN_URL =
  'https://docking-635955947416.asia-east1.run.app/api/auth/game-login'

/**
 * Registers game session after a win with the user's phone.
 */
export async function postGameLogin(phone) {
  const response = await fetch(GAME_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      game_id: 'bingo-fiesta',
      gamesecretkey: 'secret123545',
      phone: String(phone ?? '').trim(),
    }),
  })

  if (!response.ok) {
    let detail = ''
    try {
      detail = await response.text()
    } catch {
      detail = ''
    }
    throw new Error(detail || `Request failed (${response.status})`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return {}
}
