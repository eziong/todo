import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import { NoteId, NoteFolderId, ProjectId, UserId } from '@/types/branded'
import type {
  Note,
  NoteFolder,
  NoteWithFolder,
  NoteFilters,
  CreateNoteInput,
  UpdateNoteInput,
  CreateNoteFolderInput,
  UpdateNoteFolderInput,
} from '@/types/domain'

// --- Server Response Branding ---

interface ServerNote {
  id: string
  userId: string
  folderId: string | null
  projectId: string | null
  title: string
  content: string | null
  pinned: boolean
  createdAt: string
  updatedAt: string
}

interface ServerNoteWithFolder extends ServerNote {
  folderName: string | null
}

interface ServerNoteFolder {
  id: string
  userId: string
  name: string
  parentId: string | null
  position: string | null
  createdAt: string
}

function brandNote(raw: ServerNote): Note {
  return {
    ...raw,
    id: NoteId(raw.id),
    userId: UserId(raw.userId),
    folderId: raw.folderId ? NoteFolderId(raw.folderId) : null,
    projectId: raw.projectId ? ProjectId(raw.projectId) : null,
  }
}

function brandNoteWithFolder(raw: ServerNoteWithFolder): NoteWithFolder {
  return {
    ...brandNote(raw),
    folderName: raw.folderName,
  }
}

function brandNoteFolder(raw: ServerNoteFolder): NoteFolder {
  return {
    ...raw,
    id: NoteFolderId(raw.id),
    userId: UserId(raw.userId),
    parentId: raw.parentId ? NoteFolderId(raw.parentId) : null,
  }
}

// --- Note Queries ---

export async function fetchNotes(filters?: NoteFilters): Promise<NoteWithFolder[]> {
  const params = new URLSearchParams()
  if (filters?.folderId) params.set('folderId', filters.folderId)
  if (filters?.projectId) params.set('projectId', filters.projectId)
  if (filters?.pinned !== undefined) params.set('pinned', String(filters.pinned))
  if (filters?.search) params.set('search', filters.search)

  const query = params.toString()
  const path = query ? `/api/notes?${query}` : '/api/notes'
  const data = await apiGet<ServerNoteWithFolder[]>(path)
  return data.map(brandNoteWithFolder)
}

export async function fetchNote(id: string): Promise<NoteWithFolder> {
  const data = await apiGet<ServerNoteWithFolder>(`/api/notes/${id}`)
  return brandNoteWithFolder(data)
}

// --- Note Mutations ---

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const data = await apiPost<ServerNote>('/api/notes', input)
  return brandNote(data)
}

export async function updateNote(id: NoteId, input: UpdateNoteInput): Promise<Note> {
  const data = await apiPatch<ServerNote>(`/api/notes/${id}`, input)
  return brandNote(data)
}

export async function deleteNote(id: NoteId): Promise<void> {
  await apiDelete(`/api/notes/${id}`)
}

// --- Folder Queries ---

export async function fetchNoteFolders(): Promise<NoteFolder[]> {
  const data = await apiGet<ServerNoteFolder[]>('/api/note-folders')
  return data.map(brandNoteFolder)
}

// --- Folder Mutations ---

export async function createNoteFolder(input: CreateNoteFolderInput): Promise<NoteFolder> {
  const data = await apiPost<ServerNoteFolder>('/api/note-folders', input)
  return brandNoteFolder(data)
}

export async function updateNoteFolder(id: NoteFolderId, input: UpdateNoteFolderInput): Promise<NoteFolder> {
  const data = await apiPatch<ServerNoteFolder>(`/api/note-folders/${id}`, input)
  return brandNoteFolder(data)
}

export async function deleteNoteFolder(id: NoteFolderId): Promise<void> {
  await apiDelete(`/api/note-folders/${id}`)
}
