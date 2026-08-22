import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Field } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { getErrorMessage } from '../lib/api-error'
import { loginSchema, type LoginFormValues } from '../schemas/auth'
import { useAuthStore } from '../store/auth-store'

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
    <main className="flex min-h-svh items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <img
          src="/favicon.png"
          alt=""
          className="h-11 w-11 object-contain"
        />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Sign in to Pulse | Chat
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your phone and name. New numbers are registered automatically.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Phone" error={errors.phone?.message}>
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="+15551234567"
              invalid={Boolean(errors.phone)}
              {...register('phone')}
            />
          </Field>

          <Field label="Name" error={errors.name?.message}>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Your name"
              invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </Field>

          {serverError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
