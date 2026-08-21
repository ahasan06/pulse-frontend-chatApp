import { z } from 'zod'

export const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((value) => {
      const compact = value.replace(/[\s-]/g, '')
      return compact.startsWith('+') ? compact : `+${compact}`
    })
    .refine((value) => /^\+[1-9]\d{6,14}$/.test(value), {
      message: 'Use international format, e.g. +15551234567',
    }),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
