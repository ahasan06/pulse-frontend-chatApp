import { z } from 'zod'

export const searchSchema = z.object({
  q: z.string().trim().min(1, 'Enter a name'),
})

export const inboxFilterSchema = z.object({
  q: z.string(),
})

export type SearchFormValues = z.infer<typeof searchSchema>
export type InboxFilterValues = z.infer<typeof inboxFilterSchema>
