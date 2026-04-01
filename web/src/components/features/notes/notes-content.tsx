"use client"

import { useState, useEffect } from "react"
import { Plus, Pin, Search, FolderKanban } from "lucide-react"
import { cn } from "@/lib/utils"
import { NoteFolderSidebar } from "@/components/features/notes/note-folder-sidebar"
import { NoteEditor } from "@/components/features/notes/note-editor"
import type { NoteId, NoteFolderId } from "@/types/branded"
import type {
  NoteWithFolder,
  NoteFolder,
  NoteFilters,
  ProjectWithStats,
  CreateNoteInput,
  UpdateNoteInput,
  CreateNoteFolderInput,
  UpdateNoteFolderInput,
} from "@/types/domain"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function getContentPreview(content: string | null, maxLength = 150): string {
  if (!content) return "No content"
  const stripped = content.replace(/[#*_~`>\-\[\]()]/g, "").trim()
  if (stripped.length <= maxLength) return stripped
  return stripped.slice(0, maxLength) + "..."
}

interface NotesContentProps {
  notes: NoteWithFolder[]
  folders: NoteFolder[]
  projects?: ProjectWithStats[]
  filters: NoteFilters
  onFiltersChange: (filters: NoteFilters) => void
  onCreateNote: (input: CreateNoteInput) => void
  onUpdateNote: (id: NoteId, input: UpdateNoteInput) => void
  onDeleteNote: (id: NoteId) => void
  onCreateFolder: (input: CreateNoteFolderInput) => void
  onUpdateFolder: (id: NoteFolderId, input: UpdateNoteFolderInput) => void
  onDeleteFolder: (id: NoteFolderId) => void
  isCreating: boolean
  selectedNoteId: NoteId | null
  onSelectNote: (id: NoteId | null) => void
}

export function NotesContent({
  notes,
  folders,
  projects,
  filters,
  onFiltersChange,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  isCreating,
  selectedNoteId,
  onSelectNote,
}: NotesContentProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "")
  const hasEditor = selectedNoteId !== null

  // Escape key to close editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && hasEditor) {
        onSelectNote(null)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hasEditor, onSelectNote])

  const handleSearch = (value: string) => {
    setSearchValue(value)
    onFiltersChange({ ...filters, search: value || undefined })
  }

  const handleCreateNote = () => {
    onCreateNote({
      title: "Untitled",
      folderId: filters.folderId,
    })
  }

  const handleEditorClose = () => {
    onSelectNote(null)
  }

  return (
    <div className="flex h-full">
      {/* Folder sidebar */}
      <NoteFolderSidebar
        folders={folders}
        selectedFolderId={filters.folderId ?? null}
        showPinned={filters.pinned === true}
        onSelectFolder={(folderId) =>
          onFiltersChange({
            ...filters,
            folderId: folderId ?? undefined,
            pinned: undefined,
          })
        }
        onTogglePinned={() =>
          onFiltersChange({
            ...filters,
            folderId: undefined,
            pinned: filters.pinned ? undefined : true,
          })
        }
        onCreateFolder={onCreateFolder}
        onUpdateFolder={onUpdateFolder}
        onDeleteFolder={onDeleteFolder}
      />

      {/* Notes list */}
      <div className={cn(
        "border-r border-border p-6",
        hasEditor ? "w-[280px] shrink-0 overflow-y-auto" : "flex-1"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className={cn(
            "font-semibold text-foreground",
            hasEditor ? "text-base" : "text-xl"
          )}>Notes</h1>
          <button
            onClick={handleCreateNote}
            disabled={isCreating}
            className={cn(
              "flex items-center gap-2 rounded-[6px] bg-accent-blue text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50",
              hasEditor ? "h-7 w-7 justify-center p-0" : "px-3 py-2"
            )}
          >
            <Plus className="h-4 w-4" />
            {!hasEditor && "New Note"}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search notes..."
              className={cn(
                "h-9 w-full rounded-[6px] border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue",
                !hasEditor && "max-w-sm"
              )}
            />
          </div>
          {!hasEditor && projects && projects.length > 0 && (
            <div className="relative">
              <FolderKanban className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary pointer-events-none" />
              <select
                value={filters.projectId ?? ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    projectId: e.target.value || undefined,
                  })
                }
                className="h-9 appearance-none rounded-[6px] border border-border bg-background pl-9 pr-8 text-sm text-foreground focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id as string} value={p.id as string}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-background-tertiary">
              <Search className="h-6 w-6 text-foreground-secondary" />
            </div>
            <p className="text-sm font-medium text-foreground">No notes found</p>
            <p className="mt-1 text-sm text-foreground-secondary">
              {filters.search
                ? "Try a different search term"
                : "Create your first note to get started"}
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={cn(
                  "group w-full rounded-[8px] border p-3 text-left transition-colors",
                  selectedNoteId === note.id
                    ? "border-accent-blue/50 bg-accent-blue/5"
                    : "border-border bg-background-secondary hover:border-foreground-secondary/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className={cn(
                    "text-sm font-medium truncate",
                    selectedNoteId === note.id
                      ? "text-accent-blue"
                      : "text-foreground group-hover:text-accent-blue"
                  )}>
                    {note.title}
                  </h3>
                  {note.pinned && (
                    <span className="shrink-0 text-accent-blue">
                      <Pin className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <p className={cn(
                  "mt-1 text-sm text-foreground-secondary",
                  hasEditor ? "line-clamp-1" : "line-clamp-2"
                )}>
                  {getContentPreview(note.content, hasEditor ? 60 : 150)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {note.folderName && (
                    <span className="rounded-[4px] bg-background-tertiary px-1.5 py-0.5 text-xs text-foreground-secondary truncate max-w-[100px]">
                      {note.folderName}
                    </span>
                  )}
                  <span className="text-xs text-foreground-secondary">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inline Editor */}
      {hasEditor && (
        <div className="flex-1 min-w-0">
          <NoteEditor
            key={selectedNoteId as string}
            noteId={selectedNoteId}
            folders={folders}
            onClose={handleEditorClose}
          />
        </div>
      )}
    </div>
  )
}
