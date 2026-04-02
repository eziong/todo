'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes'
import {
  useNoteFolders,
  useCreateNoteFolder,
  useUpdateNoteFolder,
  useDeleteNoteFolder,
} from '@/hooks/useNoteFolders'
import { NotesContent } from '@/components/features/notes/notes-content'
import { NotesSkeleton } from '@/components/features/notes/notes-skeleton'
import { classifyError } from '@/lib/errors'
import type { NoteId, NoteFolderId } from '@/types/branded'
import type { NoteFilters, CreateNoteInput, UpdateNoteInput, CreateNoteFolderInput, UpdateNoteFolderInput } from '@/types/domain'

export default function ProjectNotesPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [filters, setFilters] = useState<NoteFilters>({ projectId })
  const [selectedNoteId, setSelectedNoteId] = useState<NoteId | null>(null)
  const { data: notes, isLoading: notesLoading, error: notesError, refetch } = useNotes(filters)
  const { data: folders, isLoading: foldersLoading } = useNoteFolders()
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const createFolder = useCreateNoteFolder()
  const updateFolder = useUpdateNoteFolder()
  const deleteFolder = useDeleteNoteFolder()

  const isLoading = notesLoading || foldersLoading

  if (isLoading) return <NotesSkeleton />

  if (notesError && !notes) {
    const classified = classifyError(notesError)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-foreground">{classified.title}</p>
        <p className="text-sm text-foreground-secondary">{classified.message}</p>
        {classified.retryable && (
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  const handleCreateNote = (input: CreateNoteInput) => {
    createNote.mutate({ ...input, projectId }, {
      onSuccess: (note) => {
        setSelectedNoteId(note.id)
      },
    })
  }

  const handleDeleteNote = (id: NoteId) => {
    if (selectedNoteId === id) {
      setSelectedNoteId(null)
    }
    deleteNote.mutate(id)
  }

  return (
    <div className="-my-6 h-[calc(100%+48px)]">
    <NotesContent
      notes={notes ?? []}
      folders={folders ?? []}
      filters={filters}
      onFiltersChange={setFilters}
      onCreateNote={handleCreateNote}
      onUpdateNote={(id: NoteId, input: UpdateNoteInput) =>
        updateNote.mutate({ id, input })
      }
      onDeleteNote={handleDeleteNote}
      onCreateFolder={(input: CreateNoteFolderInput) => createFolder.mutate(input)}
      onUpdateFolder={(id: NoteFolderId, input: UpdateNoteFolderInput) =>
        updateFolder.mutate({ id, input })
      }
      onDeleteFolder={(id: NoteFolderId) => deleteFolder.mutate(id)}
      isCreating={createNote.isPending}
      selectedNoteId={selectedNoteId}
      onSelectNote={setSelectedNoteId}
    />
    </div>
  )
}
