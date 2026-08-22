import type { IncomingMessage, ServerResponse } from 'node:http'
import { refineMessage } from '../_lib/refine-message'
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
    const banglaToEnglish = Boolean(body.banglaToEnglish)
    const grammarRefine = Boolean(body.grammarRefine)

    if (!text) {
      sendJson(res, 400, { error: { message: 'Enter a message first' } })
      return
    }
    if (!banglaToEnglish && !grammarRefine) {
      sendJson(res, 400, { error: { message: 'Enable at least one AI mode' } })
      return
    }

    const refined = await refineMessage(apiKey, {
      text,
      banglaToEnglish,
      grammarRefine,
    })
    sendJson(res, 200, { text: refined })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed'
    sendJson(res, 502, { error: { message } })
  }
}
