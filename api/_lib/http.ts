type JsonRecord = Record<string, unknown>

type NodeLikeReq = {
  body?: unknown
  json?: () => Promise<unknown>
  on?: (event: string, listener: (chunk: Buffer) => void) => void
}

type NodeLikeRes = {
  statusCode: number
  setHeader?: (name: string, value: string) => void
  end?: (body?: string) => void
  status?: (code: number) => { json: (body: unknown) => unknown }
}

function isParsedObject(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readStream(req: NodeLikeReq) {
  return new Promise<string>((resolve, reject) => {
    if (typeof req.on !== 'function') {
      resolve('')
      return
    }

    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export async function readJsonBody(req: NodeLikeReq): Promise<JsonRecord> {
  if (typeof req.json === 'function') {
    const parsed = await req.json().catch(() => ({}))
    return isParsedObject(parsed) ? parsed : {}
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
  res: NodeLikeRes | undefined,
  status: number,
  body: unknown,
) {
  if (res && typeof res.status === 'function') {
    res.status(status).json(body)
    return
  }

  if (res && typeof res.end === 'function') {
    res.statusCode = status
    res.setHeader?.('Content-Type', 'application/json')
    res.end(JSON.stringify(body))
    return
  }

  return Response.json(body, { status })
}
