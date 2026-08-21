import axios, { type AxiosError } from 'axios'
import type { ApiErrorBody } from '../types/api'

export class ApiError extends Error {
  readonly code?: string
  readonly status?: number

  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function toApiError(error: unknown) {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>
    const message =
      axiosError.response?.data?.error?.message ??
      axiosError.message ??
      'Request failed'
    const code = axiosError.response?.data?.error?.code
    return new ApiError(message, code, axiosError.response?.status)
  }

  if (error instanceof Error) {
    return new ApiError(error.message)
  }

  return new ApiError('Something went wrong')
}

function friendlyMessage(message: string) {
  if (/regular expression is invalid/i.test(message)) {
    return 'No users found. Try a name, or a number like 017... or 880...'
  }
  return message
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  return friendlyMessage(toApiError(error).message || fallback)
}
