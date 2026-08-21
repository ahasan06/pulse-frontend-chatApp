import { z } from 'zod'

export const messageSchema = z.object({
  text: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: 'Message cannot be empty',
    }),
})

export type MessageFormValues = z.infer<typeof messageSchema>
