import { apiPost, apiGet } from '@/lib/api-client'

// --- Types ---

export interface UndoResult {
  undone?: {
    tableName: string
    recordId: string
    action: string
  }
  message?: string
}

export interface RedoResult {
  redone?: {
    tableName: string
    recordId: string
    action: string
  }
  message?: string
}

export interface ChangeEntry {
  id: string
  userId: string
  tableName: string
  recordId: string
  action: string
  createdAt: string
}

// --- Mutations ---

export async function performUndo(): Promise<UndoResult> {
  return apiPost<UndoResult>('/api/undo', {})
}

export async function performRedo(): Promise<RedoResult> {
  return apiPost<RedoResult>('/api/undo/redo', {})
}

// --- Queries ---

export async function fetchUndoHistory(limit = 50): Promise<ChangeEntry[]> {
  return apiGet<ChangeEntry[]>(`/api/undo/history?limit=${limit}`)
}
