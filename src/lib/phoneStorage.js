const PHONE_STORAGE_KEY = 'bingo-fiesta-phone'

export function saveStoredPhone(phone) {
  if (typeof localStorage === 'undefined') return
  const trimmed = String(phone ?? '').trim()
  if (trimmed) {
    localStorage.setItem(PHONE_STORAGE_KEY, trimmed)
  }
}

export function loadStoredPhone() {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(PHONE_STORAGE_KEY) ?? ''
}
