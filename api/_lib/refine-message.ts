export const OPENROUTER_TEXT_MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
] as const
export const OPENROUTER_MODEL = OPENROUTER_TEXT_MODELS[0]

export type RefineMessageInput = {
  text: string
  banglaToEnglish: boolean
  grammarRefine: boolean
}

type ChatMessage = {
  content?: unknown
  reasoning?: unknown
}

type OpenRouterResponse = {
  error?: { message?: string }
  choices?: { finish_reason?: string; message?: ChatMessage }[]
}

export function buildRefinePrompt(input: RefineMessageInput) {
  const tasks: string[] = []
  if (input.banglaToEnglish) {
    tasks.push(
      'Translate Bangla and Banglish (Romanized Bangla mixed with English) into natural English. If it is already English, keep it in English.',
    )
  }
  if (input.grammarRefine) {
    tasks.push(
      'Fix grammar, spelling, and punctuation. Refine the sentence so it is clear, without changing the meaning or adding new ideas.',
    )
  }

  return [
    'You edit chat drafts.',
    'Think if needed, then put the rewritten message in your final answer.',
    'The final answer must be ONLY the rewritten message text — no quotes, labels, markdown, or explanation.',
    'Keep the original meaning and a natural chat tone.',
    ...tasks,
  ].join('\n')
}

function cleanModelOutput(text: string) {
  return text
    .trim()
    .replace(/^```[\w-]*\n?/, '')
    .replace(/\n?```$/, '')
    .replace(/^["']|["']$/g, '')
    .trim()
}

function textFromContent(content: unknown): string {
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (part && typeof part === 'object' && 'text' in part) {
        const text = (part as { text?: unknown }).text
        return typeof text === 'string' ? text : ''
      }
      return ''
    })
    .join('')
    .trim()
}

function extractChoiceText(message: ChatMessage | undefined) {
  const fromContent = textFromContent(message?.content)
  if (fromContent) return cleanModelOutput(fromContent)
  return ''
}

async function requestCompletion(
  apiKey: string,
  system: string,
  user: string,
  effort: 'low' | 'medium',
) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'https://pulse-frontend-chat-app.vercel.app',
      'X-Title': 'Pulse Chat',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.2,
      reasoning: { effort },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  const data = (await response.json()) as OpenRouterResponse
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenRouter error (${response.status})`)
  }

  return extractChoiceText(data.choices?.[0]?.message)
}

async function requestRewrite(
  apiKey: string,
  input: RefineMessageInput,
  effort: 'low' | 'medium',
) {
  return requestCompletion(
    apiKey,
    buildRefinePrompt(input),
    `Rewrite this chat message.\n\n${input.text}`,
    effort,
  )
}

export async function refineMessage(
  apiKey: string,
  input: RefineMessageInput,
): Promise<string> {
  const first = await requestRewrite(apiKey, input, 'low')
  if (first) return first

  const retry = await requestRewrite(apiKey, input, 'low')
  if (retry) return retry

  throw new Error('AI returned an empty message. Try again in a moment.')
}

export type TranslateTarget = 'english' | 'bangla'

function buildTranslatePrompt(target: TranslateTarget) {
  if (target === 'english') {
    return [
      'You translate chat messages for reading only.',
      'Translate into natural English.',
      'If the text is already English, return it unchanged.',
      'Keep names, numbers, and meaning.',
      'The final answer must be ONLY the translated text — no quotes, labels, or explanation.',
    ].join('\n')
  }

  return [
    'You translate chat messages for reading only.',
    'Translate into natural Bengali using Bangla script.',
    'If the text is already Bangla, return it unchanged.',
    'Keep names, numbers, and meaning.',
    'The final answer must be ONLY the translated text — no quotes, labels, or explanation.',
  ].join('\n')
}

export async function translateMessage(
  apiKey: string,
  text: string,
  target: TranslateTarget,
): Promise<string> {
  const first = await requestCompletion(
    apiKey,
    buildTranslatePrompt(target),
    `Translate this chat message.\n\n${text}`,
    'low',
  )
  if (first) return first

  const retry = await requestCompletion(
    apiKey,
    buildTranslatePrompt(target),
    `Translate this chat message.\n\n${text}`,
    'low',
  )
  if (retry) return retry

  throw new Error('AI returned an empty translation. Try again in a moment.')
}
