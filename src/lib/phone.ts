import type { User } from '../types/api'

export function digitString(value: string) {
  return value.replace(/\D/g, '')
}

/** Local BD 017... / +880... needles that can appear inside stored phones. */
export function phoneSearchNeedles(query: string) {
  const digits = digitString(query)
  const needles = new Set<string>()
  if (digits.length < 4) return []

  needles.add(digits)

  if (/^01\d{9}$/.test(digits)) {
    needles.add(`880${digits.slice(1)}`)
    needles.add(digits.slice(1))
  }

  if (/^8801\d{9}$/.test(digits)) {
    needles.add(digits.slice(3))
    needles.add(`0${digits.slice(3)}`)
  }

  if (/^1\d{9}$/.test(digits)) {
    needles.add(`880${digits}`)
    needles.add(`0${digits}`)
  }

  return [...needles]
}

export function phonesMatch(storedPhone: string, query: string) {
  const stored = digitString(storedPhone)
  if (!stored) return false
  return phoneSearchNeedles(query).some(
    (needle) => stored.includes(needle) || needle.includes(stored),
  )
}

export function isPhoneQuery(query: string) {
  const digits = digitString(query)
  return digits.length >= 6
}

export function nameCaseVariants(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return []
  const lower = trimmed.toLocaleLowerCase()
  const upper = trimmed.toLocaleUpperCase()
  const title = lower.replace(/\b[\p{L}\p{N}]/gu, (char) => char.toLocaleUpperCase())
  const firstCap = lower.charAt(0).toLocaleUpperCase() + lower.slice(1)
  return [...new Set([trimmed, lower, upper, title, firstCap])]
}

export function userMatchesSearch(user: User, query: string) {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return false
  if (user.name.toLocaleLowerCase().includes(needle)) return true
  return phonesMatch(user.phone, query)
}
