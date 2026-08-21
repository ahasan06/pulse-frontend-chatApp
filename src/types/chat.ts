import type { Message } from './api'

export type ClientMessage = Message & {
  status?: 'sent' | 'pending' | 'failed'
}

export type LoadStatus = 'idle' | 'loading' | 'error' | 'ready'

export const EMPTY_MESSAGES: ClientMessage[] = []
