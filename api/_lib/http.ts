import type { IncomingMessage, ServerResponse } from 'node:http'

type JsonRecord = Record<string, unknown>

function isParsedObject(value: unknown): value is JsonRecord {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Buffer.isBuffer(value) &&
    !Array.isArray(value) &&
    typeof (value as NodeJS.ReadableStream).pipe !== 'function' &&
    typeof (value as { getReader?: unknown }).getReader !== 'function'
  )
}

function readStream(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export async function readJsonBody(
  req: IncomingMessage & {
    body?: unknown
    json?: () => Promise<unknown>
  },
): Promise<JsonRecord> {
  if (typeof req.json === 'function' && req.body == null) {
    const parsed = await req.json()
    if (isParsedObject(parsed)) return parsed
    return {}
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}') as JsonRecord
  }

  if (isParsedObject(req.body)) {
    return req.body
  }

  const raw = await readStream(req)
  if (!raw.trim()) return {}
  return JSON.parse(raw) as JsonRecord
}

export function sendJson(
  res: ServerResponse & {
    status?: (code: number) => { json: (body: unknown) => unknown }
  },
  status: number,
  body: unknown,
) {
  if (typeof res.status === 'function') {
    res.status(status).json(body)
    return
  }

  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}
