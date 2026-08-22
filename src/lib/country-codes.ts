export type CountryDial = {
  iso: string
  name: string
  flag: string
  dial: string
  min: number
  max: number
  stripLeadingZero?: boolean
  placeholder: string
}

export const COUNTRIES: CountryDial[] = [
  { iso: 'BD', name: 'Bangladesh', flag: '🇧🇩', dial: '880', min: 10, max: 10, stripLeadingZero: true, placeholder: '1712345678' },
  { iso: 'US', name: 'United States', flag: '🇺🇸', dial: '1', min: 10, max: 10, placeholder: '5551234567' },
  { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧', dial: '44', min: 10, max: 10, stripLeadingZero: true, placeholder: '7400123456' },
  { iso: 'IN', name: 'India', flag: '🇮🇳', dial: '91', min: 10, max: 10, stripLeadingZero: true, placeholder: '9876543210' },
  { iso: 'PK', name: 'Pakistan', flag: '🇵🇰', dial: '92', min: 10, max: 10, stripLeadingZero: true, placeholder: '3001234567' },
  { iso: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dial: '966', min: 9, max: 9, stripLeadingZero: true, placeholder: '512345678' },
  { iso: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dial: '971', min: 9, max: 9, stripLeadingZero: true, placeholder: '501234567' },
  { iso: 'CA', name: 'Canada', flag: '🇨🇦', dial: '1', min: 10, max: 10, placeholder: '4165550123' },
  { iso: 'AU', name: 'Australia', flag: '🇦🇺', dial: '61', min: 9, max: 9, stripLeadingZero: true, placeholder: '412345678' },
  { iso: 'NP', name: 'Nepal', flag: '🇳🇵', dial: '977', min: 10, max: 10, placeholder: '9841234567' },
  { iso: 'MY', name: 'Malaysia', flag: '🇲🇾', dial: '60', min: 9, max: 10, stripLeadingZero: true, placeholder: '123456789' },
  { iso: 'SG', name: 'Singapore', flag: '🇸🇬', dial: '65', min: 8, max: 8, placeholder: '81234567' },
  { iso: 'ID', name: 'Indonesia', flag: '🇮🇩', dial: '62', min: 9, max: 12, stripLeadingZero: true, placeholder: '81234567890' },
  { iso: 'DE', name: 'Germany', flag: '🇩🇪', dial: '49', min: 10, max: 11, stripLeadingZero: true, placeholder: '1512345678' },
  { iso: 'FR', name: 'France', flag: '🇫🇷', dial: '33', min: 9, max: 9, stripLeadingZero: true, placeholder: '612345678' },
  { iso: 'IT', name: 'Italy', flag: '🇮🇹', dial: '39', min: 9, max: 10, placeholder: '3123456789' },
  { iso: 'ES', name: 'Spain', flag: '🇪🇸', dial: '34', min: 9, max: 9, placeholder: '612345678' },
  { iso: 'NL', name: 'Netherlands', flag: '🇳🇱', dial: '31', min: 9, max: 9, stripLeadingZero: true, placeholder: '612345678' },
  { iso: 'TR', name: 'Turkey', flag: '🇹🇷', dial: '90', min: 10, max: 10, stripLeadingZero: true, placeholder: '5012345678' },
  { iso: 'JP', name: 'Japan', flag: '🇯🇵', dial: '81', min: 10, max: 10, stripLeadingZero: true, placeholder: '9012345678' },
]

export const DEFAULT_COUNTRY_ISO = 'BD'

export function getCountry(iso: string) {
  return COUNTRIES.find((country) => country.iso === iso) ?? COUNTRIES[0]
}

export function nationalDigits(value: string, country: CountryDial) {
  let digits = value.replace(/\D/g, '')
  if (country.stripLeadingZero && digits.startsWith('0')) {
    digits = digits.slice(1)
  }
  return digits.slice(0, country.max)
}

export function isValidNationalNumber(iso: string, national: string) {
  const country = getCountry(iso)
  const digits = nationalDigits(national, country)
  return digits.length >= country.min && digits.length <= country.max
}

export function toE164(iso: string, national: string) {
  const country = getCountry(iso)
  const digits = nationalDigits(national, country)
  return `+${country.dial}${digits}`
}

export function phoneLengthMessage(country: CountryDial) {
  if (country.min === country.max) {
    return `${country.name} numbers need ${country.max} digits after +${country.dial}`
  }
  return `${country.name} numbers need ${country.min}–${country.max} digits after +${country.dial}`
}
