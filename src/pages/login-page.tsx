import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { PhoneField } from '../components/auth/phone-field'
import { AuroraBackground } from '../components/ui/aurora-background'
import { Button } from '../components/ui/button'
import { Field } from '../components/ui/field'
import { GridDotBackground } from '../components/ui/grid-dot-background'
import { Input } from '../components/ui/input'
import { getErrorMessage } from '../lib/api-error'
import { DEFAULT_COUNTRY_ISO, isValidNationalNumber, toE164 } from '../lib/country-codes'
import { loginSchema, sanitizeName, type LoginFormValues } from '../schemas/auth'
import { useAuthStore } from '../store/auth-store'

export function LoginPage() {
  const token = useAuthStore((state) => state.token)
  const status = useAuthStore((state) => state.status)
  const login = useAuthStore((state) => state.login)
  const [serverError, setServerError] = useState('')

  const {
    control,
    handleSubmit,
    setValue,
    clearErrors,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      countryIso: DEFAULT_COUNTRY_ISO,
      nationalNumber: '',
      name: '',
    },
  })

  const countryIso = watch('countryIso')
  const nationalNumber = watch('nationalNumber')
  const phoneInvalid =
    Boolean(errors.nationalNumber) && !isValidNationalNumber(countryIso, nationalNumber)

  if (status === 'ready' && token) {
    return <Navigate to="/chat" replace />
  }

  async function onSubmit(values: LoginFormValues) {
    setServerError('')
    try {
      await login({
        phone: toE164(values.countryIso, values.nationalNumber),
        name: values.name.trim(),
      })
    } catch (error) {
      setServerError(getErrorMessage(error, 'Could not log in. Try again.'))
    }
  }

  function updateCountry(iso: string) {
    setValue('countryIso', iso, { shouldDirty: true })
    if (isValidNationalNumber(iso, nationalNumber)) {
      clearErrors('nationalNumber')
    } else {
      void trigger('nationalNumber')
    }
  }

  function updateNumber(value: string) {
    setValue('nationalNumber', value, { shouldDirty: true, shouldTouch: true })
    if (isValidNationalNumber(countryIso, value)) {
      clearErrors('nationalNumber')
    } else {
      void trigger('nationalNumber')
    }
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-mz-page">
      <AuroraBackground className="min-h-svh overflow-x-clip">
        <div className="relative min-h-svh">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.22]"
          >
            <GridDotBackground
              showGrid
              showDots
              mask="full"
              gridClassName="opacity-70"
              dotsClassName="opacity-60"
            />
          </div>
          <div className="relative z-10 flex min-h-svh items-center justify-center px-4 py-8">
      <section className="relative w-full max-w-md rounded-3xl border border-mz-border bg-mz-surface/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-mz-page p-2 ring-1 ring-mz-border">
            <img src="/favicon.png" alt="" className="h-full w-full object-contain" />
          </span>
          <div>
            <p className="text-sm font-medium text-mz-muted">Pulse | Chat</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Sign in
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-mz-muted">
          Phone and name only. New numbers become an account automatically.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Phone" error={phoneInvalid ? errors.nationalNumber?.message : undefined}>
            <PhoneField
              countryIso={countryIso}
              nationalNumber={nationalNumber}
              invalid={phoneInvalid}
              onCountryChange={updateCountry}
              onNumberChange={updateNumber}
            />
          </Field>

          <Field label="Name" error={errors.name?.message}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  inputMode="text"
                  autoComplete="name"
                  autoCorrect="off"
                  spellCheck={false}
                  name="fullName"
                  placeholder="Your name"
                  invalid={Boolean(errors.name)}
                  value={field.value}
                  className="border-mz-border bg-mz-elevated text-white placeholder:text-mz-muted"
                  onChange={(event) => {
                    field.onChange(sanitizeName(event.target.value))
                  }}
                  onBlur={field.onBlur}
                  onKeyDown={(event) => {
                    if (event.key.length === 1 && /[0-9]/.test(event.key) && !event.ctrlKey && !event.metaKey) {
                      event.preventDefault()
                    }
                  }}
                  onPaste={(event) => {
                    event.preventDefault()
                    field.onChange(sanitizeName(`${field.value}${event.clipboardData.getData('text')}`))
                  }}
                />
              )}
            />
          </Field>

          {serverError ? (
            <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {serverError}
            </p>
          ) : null}

          <Button type="submit" className="h-12 w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Continue'}
          </Button>
        </form>
      </section>
          </div>
        </div>
      </AuroraBackground>
    </main>
  )
}
