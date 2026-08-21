import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import { refineMessage, translateMessage } from './server/refine-message.ts'

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function handleAi(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
  apiKey: string | undefined,
) {
  const path = req.url?.split('?')[0]
  if (path !== '/api/ai/refine' && path !== '/api/ai/translate') {
    next()
    return
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: { message: 'Method not allowed' } })
    return
  }

  if (!apiKey) {
    sendJson(res, 503, {
      error: { message: 'OPENROUTER_API_KEY is not configured' },
    })
    return
  }

  try {
    const raw = await readBody(req)
    const body = JSON.parse(raw || '{}') as {
      text?: unknown
      banglaToEnglish?: unknown
      grammarRefine?: unknown
      target?: unknown
    }
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    if (!text) {
      sendJson(res, 400, { error: { message: 'Enter a message first' } })
      return
    }

    if (path === '/api/ai/translate') {
      const target =
        body.target === 'bangla'
          ? 'bangla'
          : body.target === 'english'
            ? 'english'
            : null
      if (!target) {
        sendJson(res, 400, { error: { message: 'Choose English or Bangla' } })
        return
      }
      const translated = await translateMessage(apiKey, text, target)
      sendJson(res, 200, { text: translated })
      return
    }

    const banglaToEnglish = Boolean(body.banglaToEnglish)
    const grammarRefine = Boolean(body.grammarRefine)
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

export function openRouterPlugin(apiKey: string | undefined): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    void handleAi(req, res, next, apiKey)
  }

  return {
    name: 'openrouter-refine',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
