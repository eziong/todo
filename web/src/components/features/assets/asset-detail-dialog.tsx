"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Image,
  Film,
  FileText,
  HardDrive,
  Cloud,
  Calendar,
  Tag,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAssetPublicUrl } from '@/services/assets'
import type { Asset, UpdateAssetInput } from '@/types/domain'
import type { AssetId } from '@/types/branded'

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
  return `${bytes} B`
}

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('video/')) return Film
  return FileText
}

interface AssetDetailDialogProps {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: AssetId, input: UpdateAssetInput) => void
  onDelete: (id: AssetId) => void
  isUpdating?: boolean
}

export function AssetDetailDialog({
  asset,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  isUpdating,
}: AssetDetailDialogProps) {
  const [tagsInput, setTagsInput] = useState('')
  const [editingTags, setEditingTags] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!asset) return null

  const MimeIcon = getMimeIcon(asset.mimeType)
  const isImage = asset.mimeType.startsWith('image/')

  const handleSaveTags = () => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onUpdate(asset.id, { tags })
    setEditingTags(false)
  }

  const handleStartEditTags = () => {
    setTagsInput(asset.tags.join(', '))
    setEditingTags(true)
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    onDelete(asset.id)
    onOpenChange(false)
    setConfirmDelete(false)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingTags(false)
      setConfirmDelete(false)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">{asset.filename}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <div className="flex items-center justify-center rounded-xl border border-border bg-background-secondary p-4">
            {isImage && asset.thumbnailUrl ? (
              <img
                src={asset.thumbnailUrl}
                alt={asset.filename}
                className="max-h-64 rounded-lg object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <MimeIcon className="h-16 w-16 text-foreground-secondary" />
                <span className="text-sm text-foreground-secondary">{asset.mimeType}</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-secondary">Size</span>
              <span className="font-medium text-foreground">{formatFileSize(asset.sizeBytes)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-secondary">Type</span>
              <span className="font-medium text-foreground">{asset.mimeType}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-foreground-secondary">
                {asset.storageType === 'local' ? (
                  <HardDrive className="h-3.5 w-3.5" />
                ) : (
                  <Cloud className="h-3.5 w-3.5" />
                )}
                Storage
              </span>
              <span className="font-medium text-foreground">
                {asset.storageType === 'local' ? 'Local Storage' : 'Google Drive'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-foreground-secondary">
                <Calendar className="h-3.5 w-3.5" />
                Uploaded
              </span>
              <span className="font-medium text-foreground">
                {new Date(asset.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </span>
              {!editingTags && (
                <button
                  onClick={handleStartEditTags}
                  className="text-xs text-accent-blue hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
            {editingTags ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="h-9 flex-1 rounded-lg border border-border bg-background-secondary px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSaveTags()}
                />
                <button
                  onClick={handleSaveTags}
                  disabled={isUpdating}
                  className="h-9 rounded-lg bg-accent-blue px-3 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {asset.tags.length > 0 ? (
                  asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-background-tertiary px-2 py-0.5 text-xs text-foreground-secondary"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-foreground-secondary">No tags</span>
                )}
              </div>
            )}
          </div>

          {/* Open external */}
          {asset.storageType === 'local' && asset.storagePath && (
            <a
              href={getAssetPublicUrl(asset.storagePath)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-accent-blue hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in new tab
            </a>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={handleDelete}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              confirmDelete
                ? "bg-accent-red text-white hover:bg-accent-red/90"
                : "border border-accent-red/30 text-accent-red hover:bg-accent-red/10"
            )}
          >
            <Trash2 className="h-4 w-4" />
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
          <button
            onClick={() => handleClose(false)}
            className="h-9 rounded-lg border border-border px-4 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
