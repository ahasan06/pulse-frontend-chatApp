import type { IncomingMessage, ServerResponse } from 'node:http'
import { translateMessage } from '../../server/refine-message.ts'

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export default async function handler(
  req: IncomingMessage & { body?: unknown; method?: string },
  res: ServerResponse,
) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: { message: 'Method not allowed' } })
    return
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    sendJson(res, 503, {
      error: { message: 'OPENROUTER_API_KEY is not configured' },
    })
    return
  }

  const body =
    typeof req.body === 'object' && req.body
      ? (req.body as Record<string, unknown>)
      : {}
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const target =
    body.target === 'bangla'
      ? 'bangla'
      : body.target === 'english'
        ? 'english'
        : null

  if (!text) {
    sendJson(res, 400, { error: { message: 'Enter a message first' } })
    return
  }
  if (!target) {
    sendJson(res, 400, { error: { message: 'Choose English or Bangla' } })
    return
  }

  try {
    const translated = await translateMessage(apiKey, text, target)
    sendJson(res, 200, { text: translated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed'
    sendJson(res, 502, { error: { message } })
  }
}
