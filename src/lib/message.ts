import type { Message } from '../types/api'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

function toIsoDate(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString()
  }
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value)
    if (Number.isFinite(numeric) && /^\d+$/.test(value)) {
      return new Date(numeric).toISOString()
    }
    return value
  }
  return new Date().toISOString()
}

/** REST uses `_id` + ISO dates; Socket.io uses `id` + epoch ms. */
export function normalizeMessage(payload: unknown): Message | null {
  const root = asRecord(payload)
  if (!root) return null

  const nested = asRecord(root.message)
  const value = nested ?? root

  const id = String(value._id ?? value.id ?? '')
  const conversation = String(value.conversation ?? value.conversationId ?? '')
  const sender = String(value.sender ?? value.senderId ?? '')
  const text = typeof value.text === 'string' ? value.text : ''

  if (!id || !conversation || !sender) return null

  return {
    _id: id,
    conversation,
    sender,
    text,
    createdAt: toIsoDate(value.createdAt),
  }
}
