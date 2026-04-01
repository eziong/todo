import { toast } from 'sonner'
import { ApiError } from './api-error'

export type ErrorType = 'network' | 'timeout' | 'server' | 'auth' | 'unknown'

export interface ClassifiedError {
  type: ErrorType
  title: string
  message: string
  retryable: boolean
}

export function classifyError(error: unknown): ClassifiedError {
  // ApiError from NestJS server responses
  if (error instanceof ApiError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        type: 'auth',
        title: 'Authentication Error',
        message: 'Your session may have expired. Please sign in again.',
        retryable: false,
      }
    }
    if (error.statusCode >= 500) {
      return {
        type: 'server',
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again.',
        retryable: true,
      }
    }
    if (error.statusCode === 404) {
      return {
        type: 'unknown',
        title: 'Not Found',
        message: error.serverMessage,
        retryable: false,
      }
    }
    return {
      type: 'unknown',
      title: 'Error',
      message: error.serverMessage,
      retryable: false,
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
      return {
        type: 'network',
        title: 'Connection Error',
        message: 'Please check your internet connection and try again.',
        retryable: true,
      }
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        type: 'timeout',
        title: 'Request Timeout',
        message: 'The request took too long. Please try again.',
        retryable: true,
      }
    }

    // Auth errors
    if (message.includes('401') || message.includes('403') || message.includes('jwt') || message.includes('auth')) {
      return {
        type: 'auth',
        title: 'Authentication Error',
        message: 'Your session may have expired. Please sign in again.',
        retryable: false,
      }
    }

    // Server errors (5xx)
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return {
        type: 'server',
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again.',
        retryable: true,
      }
    }
  }

  return {
    type: 'unknown',
    title: 'Error',
    message: 'An unexpected error occurred.',
    retryable: false,
  }
}

export function handleMutationError(error: unknown) {
  const classified = classifyError(error)
  toast.error(classified.title, {
    description: classified.message,
  })
}
