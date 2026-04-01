import { ApiError } from './api-error'
import { supabase } from './supabase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let serverMessage = `HTTP ${response.status}`
    try {
      const errorBody = await response.json()
      // Server envelope: { success, error: { statusCode, message }, timestamp }
      if (errorBody.error && typeof errorBody.error === 'object') {
        const msg = errorBody.error.message
        serverMessage = Array.isArray(msg) ? msg.join(', ') : (msg ?? serverMessage)
      } else {
        const msg = errorBody.message ?? errorBody.error
        serverMessage = Array.isArray(msg) ? msg.join(', ') : (msg ?? serverMessage)
      }
    } catch {
      // Use default message if body parsing fails
    }
    throw new ApiError(response.status, String(serverMessage))
  }

  // DELETE with 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  const json = await response.json()

  // Unwrap NestJS response envelope: { success, data, timestamp }
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T
  }

  return json as T
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>('GET', path)
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>('POST', path, body)
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>('PATCH', path, body)
}

export function apiDelete(path: string): Promise<void> {
  return apiRequest<void>('DELETE', path)
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = await getAuthToken()

  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  // Do NOT set Content-Type — browser sets multipart boundary automatically

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    let serverMessage = `HTTP ${response.status}`
    try {
      const errorBody = await response.json()
      // Server envelope: { success, error: { statusCode, message }, timestamp }
      if (errorBody.error && typeof errorBody.error === 'object') {
        const msg = errorBody.error.message
        serverMessage = Array.isArray(msg) ? msg.join(', ') : (msg ?? serverMessage)
      } else {
        const msg = errorBody.message ?? errorBody.error
        serverMessage = Array.isArray(msg) ? msg.join(', ') : (msg ?? serverMessage)
      }
    } catch {
      // Use default message if body parsing fails
    }
    throw new ApiError(response.status, String(serverMessage))
  }

  const json = await response.json()

  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T
  }

  return json as T
}
