export type RefineModes = {
  banglaToEnglish: boolean
  grammarRefine: boolean
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

  const data = (await response.json()) as {
    text?: string
    error?: { message?: string }
  }

  if (!response.ok || !data.text) {
    throw new Error(data.error?.message || 'AI could not refine this message')
  }

  return data.text
}

export type TranslateTarget = 'english' | 'bangla'

export async function translateForReading(text: string, target: TranslateTarget) {
  const response = await fetch('/api/ai/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({ text, target }),
  })

  const data = (await response.json()) as {
    text?: string
    error?: { message?: string }
  }

  if (!response.ok || !data.text) {
    throw new Error(data.error?.message || 'AI could not translate this message')
  }

  return data.text
}
