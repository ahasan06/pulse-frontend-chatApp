import { translateMessage } from '../_lib/refine-message.js'
import { readJsonBody, sendJson } from '../_lib/http.js'

export const config = {
  maxDuration: 30,
}

export default async function handler(
  req: { method?: string; body?: unknown; json?: () => Promise<unknown> },
  res?: {
    statusCode: number
    setHeader?: (name: string, value: string) => void
    end?: (body?: string) => void
    status?: (code: number) => { json: (body: unknown) => unknown }
  },
) {
  try {
    if (req.method === 'OPTIONS') {
      if (res?.end) {
        res.statusCode = 204
        res.end()
        return
      }
      return new Response(null, { status: 204 })
    }

    if (req.method !== 'POST') {
      return sendJson(res, 405, { error: { message: 'Method not allowed' } })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return sendJson(res, 503, {
        error: { message: 'OPENROUTER_API_KEY is not configured on Vercel' },
      })
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
      return sendJson(res, 400, { error: { message: 'Enter a message first' } })
    }
    if (!target) {
      return sendJson(res, 400, { error: { message: 'Choose English or Bangla' } })
    }

    const translated = await translateMessage(apiKey, text, target)
    return sendJson(res, 200, { text: translated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed'
    return sendJson(res, 502, { error: { message } })
  }
}
