import { useEffect, useMemo, useRef, useState } from 'react'
import { HiChevronDown, HiMagnifyingGlass } from 'react-icons/hi2'
import { cn } from '../../lib/cn'
import {
  COUNTRIES,
  getCountry,
  nationalDigits,
  type CountryDial,
} from '../../lib/country-codes'

type PhoneFieldProps = {
  countryIso: string
  nationalNumber: string
  invalid?: boolean
  onCountryChange: (iso: string) => void
  onNumberChange: (value: string) => void
}

export function PhoneField({
  countryIso,
  nationalNumber,
  invalid,
  onCountryChange,
  onNumberChange,
}: PhoneFieldProps) {
  const country = getCountry(countryIso)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return COUNTRIES
    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.iso.toLowerCase().includes(needle) ||
        item.dial.includes(needle.replace(/\D/g, '')),
    )
  }, [query])

  function pickCountry(next: CountryDial) {
    onCountryChange(next.iso)
    onNumberChange(nationalDigits(nationalNumber, next))
    setQuery('')
    setOpen(false)
  }

  const lengthHint =
    country.min === country.max
      ? `${country.max} digits after +${country.dial}`
      : `${country.min}–${country.max} digits after +${country.dial}`

  return (
    <div ref={rootRef} className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Country code"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              'inline-flex h-11 items-center gap-1.5 rounded-lg border bg-mz-elevated px-2.5 text-sm text-white',
              invalid ? 'border-red-400' : 'border-mz-border',
            )}
          >
            <span aria-hidden>{country.flag}</span>
            <span className="font-medium">+{country.dial}</span>
            <HiChevronDown className={cn('h-4 w-4 text-mz-muted transition', open && 'rotate-180')} />
          </button>

          {open ? (
            <div className="absolute top-[calc(100%+6px)] left-0 z-30 w-72 overflow-hidden rounded-xl border border-mz-border bg-mz-surface shadow-xl">
              <div className="relative border-b border-mz-border px-2 py-2">
                <HiMagnifyingGlass className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-mz-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search country"
                  className="h-9 w-full rounded-lg bg-mz-elevated pr-3 pl-9 text-sm text-white outline-none placeholder:text-mz-muted"
                />
              </div>
              <ul className="max-h-56 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-mz-muted">No countries found</li>
                ) : (
                  filtered.map((item) => (
                    <li key={`${item.iso}-${item.dial}`}>
                      <button
                        type="button"
                        onClick={() => pickCountry(item)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-mz-elevated',
                          item.iso === country.iso && 'bg-mz-accent/15 text-white',
                        )}
                      >
                        <span>{item.flag}</span>
                        <span className="min-w-0 flex-1 truncate">{item.name}</span>
                        <span className="text-mz-muted">+{item.dial}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}
        </div>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={country.placeholder}
          value={nationalNumber}
          maxLength={country.max + (country.stripLeadingZero ? 1 : 0)}
          aria-invalid={invalid}
          onChange={(event) => {
            onNumberChange(nationalDigits(event.target.value, country))
          }}
          onPaste={(event) => {
            event.preventDefault()
            onNumberChange(nationalDigits(event.clipboardData.getData('text'), country))
          }}
          onKeyDown={(event) => {
            if (event.key.length === 1 && !/[0-9]/.test(event.key) && !event.ctrlKey && !event.metaKey) {
              event.preventDefault()
            }
          }}
          className={cn(
            'h-11 min-w-0 flex-1 rounded-lg border bg-mz-elevated px-3 text-sm text-white outline-none placeholder:text-mz-muted focus:ring-2 focus:ring-mz-accent/30',
            invalid ? 'border-red-400' : 'border-mz-border focus:border-mz-accent',
          )}
        />
      </div>
      <p className="text-xs text-mz-muted">
        {nationalNumber.replace(/\D/g, '').length}/{country.max} · {lengthHint}
      </p>
    </div>
  )
}
