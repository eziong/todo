"use client"

import { useState } from "react"
import {
  FileText,
  Pin,
  FolderPlus,
  Trash2,
  Pencil,
  Check,
  X,
  Folder,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { NoteFolderId } from "@/types/branded"
import type { NoteFolder, CreateNoteFolderInput, UpdateNoteFolderInput } from "@/types/domain"

interface NoteFolderSidebarProps {
  folders: NoteFolder[]
  selectedFolderId: string | null
  showPinned: boolean
  onSelectFolder: (folderId: string | null) => void
  onTogglePinned: () => void
  onCreateFolder: (input: CreateNoteFolderInput) => void
  onUpdateFolder: (id: NoteFolderId, input: UpdateNoteFolderInput) => void
  onDeleteFolder: (id: NoteFolderId) => void
}

export function NoteFolderSidebar({
  folders,
  selectedFolderId,
  showPinned,
  onSelectFolder,
  onTogglePinned,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
}: NoteFolderSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingId, setEditingId] = useState<NoteFolderId | null>(null)
  const [editingName, setEditingName] = useState("")

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder({ name: newFolderName.trim() })
      setNewFolderName("")
      setIsCreating(false)
    }
  }

  const handleUpdateFolder = (id: NoteFolderId) => {
    if (editingName.trim()) {
      onUpdateFolder(id, { name: editingName.trim() })
      setEditingId(null)
      setEditingName("")
    }
  }

  return (
    <div className="w-56 shrink-0 border-r border-border">
      <div className="p-3 space-y-1">
        {/* All Notes */}
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-sm transition-colors",
            !selectedFolderId && !showPinned
              ? "bg-background-tertiary text-foreground"
              : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          <span>All Notes</span>
        </button>

        {/* Pinned */}
        <button
          onClick={onTogglePinned}
          className={cn(
            "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-sm transition-colors",
            showPinned
              ? "bg-background-tertiary text-foreground"
              : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
          )}
        >
          <Pin className="h-4 w-4" />
          <span>Pinned</span>
        </button>

        {/* Divider */}
        <div className="pt-3 pb-1">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-medium uppercase tracking-wider text-foreground-secondary">
              Folders
            </span>
            <button
              onClick={() => setIsCreating(true)}
              className="text-foreground-secondary transition-colors hover:text-foreground"
              aria-label="New folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* New folder input */}
        {isCreating && (
          <div className="flex items-center gap-1 px-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) handleCreateFolder()
                if (e.key === "Escape") {
                  setIsCreating(false)
                  setNewFolderName("")
                }
              }}
              placeholder="Folder name"
              className="h-7 flex-1 rounded-[4px] border border-border bg-background px-2 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              className="flex h-6 w-6 items-center justify-center rounded-[4px] text-accent-green hover:bg-background-tertiary"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setNewFolderName("")
              }}
              className="flex h-6 w-6 items-center justify-center rounded-[4px] text-foreground-secondary hover:bg-background-tertiary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Folder list */}
        {folders.map((folder) => (
          <div key={folder.id} className="group flex items-center">
            {editingId === folder.id ? (
              <div className="flex flex-1 items-center gap-1 px-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) handleUpdateFolder(folder.id)
                    if (e.key === "Escape") {
                      setEditingId(null)
                      setEditingName("")
                    }
                  }}
                  className="h-7 flex-1 rounded-[4px] border border-border bg-background px-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdateFolder(folder.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-[4px] text-accent-green hover:bg-background-tertiary"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setEditingId(null)
                    setEditingName("")
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-[4px] text-foreground-secondary hover:bg-background-tertiary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onSelectFolder(folder.id as string)}
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-[6px] px-2 py-1.5 text-sm transition-colors",
                    selectedFolderId === (folder.id as string)
                      ? "bg-background-tertiary text-foreground"
                      : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                  )}
                >
                  <Folder className="h-4 w-4" />
                  <span className="truncate">{folder.name}</span>
                </button>
                <div className="hidden items-center group-hover:flex">
                  <button
                    onClick={() => {
                      setEditingId(folder.id)
                      setEditingName(folder.name)
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-[4px] text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDeleteFolder(folder.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-[4px] text-foreground-secondary hover:bg-background-tertiary hover:text-accent-red"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
