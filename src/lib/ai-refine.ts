export type RefineModes = {
  banglaToEnglish: boolean
  grammarRefine: boolean
}

type AiResponse = {
  text?: string
  error?: { message?: string }
}

async function readAiResponse(response: Response, fallback: string) {
  const raw = await response.text()
  let data: AiResponse = {}

  if (raw) {
    try {
      data = JSON.parse(raw) as AiResponse
    } catch {
      throw new Error(raw.slice(0, 160) || fallback)
    }
  }

  if (!response.ok || !data.text) {
    throw new Error(data.error?.message || fallback)
  }

  return data.text
}

export async function refineDraft(text: string, modes: RefineModes) {
  const response = await fetch('/api/ai/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({
      text,
      banglaToEnglish: modes.banglaToEnglish,
      grammarRefine: modes.grammarRefine,
    }),
  })

  return readAiResponse(response, 'AI could not refine this message')
}

export type TranslateTarget = 'english' | 'bangla'

export async function translateForReading(text: string, target: TranslateTarget) {
  const response = await fetch('/api/ai/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({ text, target }),
  })

  return readAiResponse(response, 'AI could not translate this message')
}
