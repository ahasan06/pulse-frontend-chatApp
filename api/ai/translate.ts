import type { IncomingMessage, ServerResponse } from 'node:http'
import { translateMessage } from '../_lib/refine-message'
import { readJsonBody, sendJson } from '../_lib/http'

export const config = {
  maxDuration: 30,
}

export default async function handler(
  req: IncomingMessage & { body?: unknown; method?: string },
  res: ServerResponse,
) {
  try {
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
        error: { message: 'OPENROUTER_API_KEY is not configured on Vercel' },
      })
      return
    }

    const body = await readJsonBody(req)
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

    const translated = await translateMessage(apiKey, text, target)
    sendJson(res, 200, { text: translated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed'
    sendJson(res, 502, { error: { message } })
  }
}
