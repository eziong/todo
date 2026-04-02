"use client"

import { useState, useRef, useEffect } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  X,
  Pin,
  PinOff,
  Eye,
  Pencil,
  Trash2,
  Folder,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useNote, useUpdateNote, useDeleteNote } from "@/hooks/useNotes"
import { Skeleton } from "@/components/ui/skeleton"
import type { NoteId } from "@/types/branded"
import type { NoteFolder } from "@/types/domain"

interface NoteEditorProps {
  noteId: NoteId
  folders: NoteFolder[]
  onClose: () => void
}

export function NoteEditor({ noteId, folders, onClose }: NoteEditorProps) {
  const { data: note, isLoading } = useNote(noteId as string)
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()

  const [isPreview, setIsPreview] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [showFolderSelect, setShowFolderSelect] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  // Sync state when note data loads (only on initial load or noteId change)
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content ?? "")
      initializedRef.current = true
    }
  }, [note?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const scheduleAutoSave = (updates: { title?: string; content?: string }) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      updateNote.mutate({ id: noteId, input: updates })
    }, 1000)
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    scheduleAutoSave({ title: value, content })
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    scheduleAutoSave({ title, content: value })
  }

  const handleTogglePin = () => {
    if (!note) return
    updateNote.mutate({ id: noteId, input: { pinned: !note.pinned } })
  }

  const handleFolderChange = (folderId: string | null) => {
    updateNote.mutate({ id: noteId, input: { folderId } })
    setShowFolderSelect(false)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    deleteNote.mutate(noteId, {
      onSuccess: () => onClose(),
      onSettled: () => setShowDeleteConfirm(false),
    })
  }

  if (isLoading || !note) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Skeleton className="h-6 w-32" />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFolderSelect(!showFolderSelect)}
              className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
            >
              <Folder className="h-3 w-3" />
              {note.folderName ?? "No folder"}
            </button>
            {showFolderSelect && (
              <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-xl border border-border bg-background-secondary p-1 shadow-lg">
                <button
                  onClick={() => handleFolderChange(null)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-full px-2 py-1.5 text-sm transition-colors",
                    !note.folderId
                      ? "bg-background-tertiary text-foreground"
                      : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                  )}
                >
                  No folder
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleFolderChange(folder.id as string)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-full px-2 py-1.5 text-sm transition-colors",
                      (note.folderId as string) === (folder.id as string)
                        ? "bg-background-tertiary text-foreground"
                        : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                    )}
                  >
                    <Folder className="h-3.5 w-3.5" />
                    {folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              isPreview
                ? "bg-background-tertiary text-foreground"
                : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
            )}
            aria-label={isPreview ? "Edit" : "Preview"}
          >
            {isPreview ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleTogglePin}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              note.pinned
                ? "text-accent-blue"
                : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
            )}
            aria-label={note.pinned ? "Unpin" : "Pin"}
          >
            {note.pinned ? (
              <PinOff className="h-4 w-4" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-accent-red"
            aria-label="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
            aria-label="Close editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-auto p-6">
        {/* Title */}
        {isPreview ? (
          <h1 className="mb-6 text-2xl font-bold text-foreground">{title || "Untitled"}</h1>
        ) : (
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="mb-6 w-full border-none bg-transparent text-2xl font-bold text-foreground placeholder:text-foreground-secondary/50 focus:outline-none"
          />
        )}

        {/* Content */}
        {isPreview ? (
          <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground-secondary prose-a:text-accent-blue prose-strong:text-foreground prose-code:text-accent-purple prose-code:bg-background-tertiary prose-code:rounded prose-code:px-1 prose-pre:bg-background-tertiary prose-pre:border prose-pre:border-border prose-li:text-foreground-secondary prose-blockquote:border-accent-blue prose-blockquote:text-foreground-secondary">
            <Markdown remarkPlugins={[remarkGfm]}>
              {content || "*Start writing...*"}
            </Markdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing..."
            className="min-h-[60vh] w-full resize-none border-none bg-transparent font-mono text-sm text-foreground placeholder:text-foreground-secondary/50 focus:outline-none leading-relaxed"
          />
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => { if (!open) setShowDeleteConfirm(false) }}
      >
        <AlertDialogContent className="border-border bg-background-secondary">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Note</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground-secondary">
              Are you sure you want to delete{title ? ` "${title}"` : " this note"}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-accent-red text-white hover:bg-accent-red/90"
            >
              {deleteNote.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
