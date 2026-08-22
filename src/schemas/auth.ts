import { z } from 'zod'
import {
  getCountry,
  isValidNationalNumber,
  nationalDigits,
  phoneLengthMessage,
} from '../lib/country-codes'

export const NAME_PATTERN = /^[\p{L}\p{M}\s.'-]+$/u

export function sanitizeName(value: string) {
  return value.replace(/[^\p{L}\p{M}\s.'-]/gu, '')
}

export const loginSchema = z
  .object({
    countryIso: z.string().min(2),
    nationalNumber: z.string(),
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 letters')
      .max(40, 'Name is too long')
      .refine((value) => NAME_PATTERN.test(value), {
        message: 'Name can only include letters and spaces',
      }),
  })
  .superRefine((values, ctx) => {
    const country = getCountry(values.countryIso)
    const digits = nationalDigits(values.nationalNumber, country)

    if (!digits) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nationalNumber'],
        message: 'Enter a phone number',
      })
      return
    }

    if (!isValidNationalNumber(values.countryIso, values.nationalNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nationalNumber'],
        message: phoneLengthMessage(country),
      })
    }
  })

export type LoginFormValues = z.infer<typeof loginSchema>
