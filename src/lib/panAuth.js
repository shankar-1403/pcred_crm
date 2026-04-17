/**
 * Indian PAN is 10 chars: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).
 * Firebase Auth email/password still needs an email-shaped identifier; we map PAN → synthetic email.
 */
const PAN_AUTH_EMAIL_HOST = 'pan-login.pcred-crm.internal'

export function normalizePan(pan) {
  return String(pan ?? '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
}

export function isValidPan(pan) {
  const p = normalizePan(pan)
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p)
}

/** Synthetic email used only for Firebase Auth for ambassador roles. */
export function panToAuthEmail(pan) {
  const p = normalizePan(pan)
  if (!isValidPan(p)) {
    throw new Error('Invalid PAN format (expected e.g. ABCDE1234F).')
  }
  return `${p.toLowerCase()}@${PAN_AUTH_EMAIL_HOST}`
}

/** Login field: real email, or PAN for ambassador-style accounts. */
export function loginIdToAuthEmail(loginId) {
  const id = String(loginId ?? '').trim()
  if (!id) {
    throw new Error('Email or PAN is required.')
  }
  if (id.includes('@')) {
    return id
  }
  return panToAuthEmail(id)
}
