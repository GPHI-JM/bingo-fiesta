export function sanitizePhilippineMobileInput(phone) {
  let digits = String(phone ?? '').replace(/\D/g, '')

  if (digits.startsWith('63')) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  return digits.slice(0, 10)
}

export function normalizePhilippineMobileNumber(phone) {
  const digits = sanitizePhilippineMobileInput(phone)

  if (/^9\d{9}$/.test(digits)) {
    return digits
  }

  return ''
}

export function isValidPhilippineMobileNumber(phone) {
  return normalizePhilippineMobileNumber(phone).length > 0
}
