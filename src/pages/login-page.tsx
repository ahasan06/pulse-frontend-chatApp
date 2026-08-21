import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { getErrorMessage } from '../lib/api-error'
import { useAuthStore } from '../store/auth-store'

const loginSchema = z.object({
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

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const token = useAuthStore((state) => state.token)
  const status = useAuthStore((state) => state.status)
  const login = useAuthStore((state) => state.login)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      name: '',
    },
  })

  if (status === 'ready' && token) {
    return <Navigate to="/chat" replace />
  }

  async function onSubmit(values: LoginFormValues) {
    setServerError('')
    try {
      await login(values)
    } catch (error) {
      setServerError(getErrorMessage(error, 'Could not log in. Try again.'))
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
        <HiOutlineChatBubbleLeftRight className="h-10 w-10 text-emerald-400" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Sign in to Pulse
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your phone and name. New numbers are registered automatically.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Phone</span>
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="+15551234567"
              invalid={Boolean(errors.phone)}
              {...register('phone')}
            />
            {errors.phone ? (
              <span className="text-xs text-red-400">{errors.phone.message}</span>
            ) : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Name</span>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Your name"
              invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name ? (
              <span className="text-xs text-red-400">{errors.name.message}</span>
            ) : null}
          </label>

          {serverError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {serverError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Continue'}
          </Button>
        </form>
      </section>
    </main>
  )
}
