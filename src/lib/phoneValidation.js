export function sanitizePhilippineMobileInput(phone) {
  return String(phone ?? '')
    .replace(/\D/g, '')
    .slice(0, 10)
}

export function normalizePhilippineMobileNumber(phone) {
  const digits = sanitizePhilippineMobileInput(phone)

  if (digits.length === 10) {
    return digits
  }

  return ''
}

export function isValidPhilippineMobileNumber(phone) {
  return normalizePhilippineMobileNumber(phone).length > 0
}
