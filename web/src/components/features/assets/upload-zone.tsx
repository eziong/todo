"use client"

import { useState, useRef } from 'react'
import { Upload, Cloud, HardDrive, X, File, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type StorageTarget = 'auto' | 'local' | 'google_drive'

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
  return `${bytes} B`
}

function getAutoStorageTarget(file: File): 'local' | 'google_drive' {
  // Videos and large files (>50MB) → Drive, everything else → Local
  if (file.type.startsWith('video/')) return 'google_drive'
  if (file.size > 50 * 1024 * 1024) return 'google_drive'
  return 'local'
}

interface UploadZoneProps {
  onUploadLocal: (file: File) => void
  onUploadDrive: (file: File) => void
  isUploading: boolean
  googleConnected: boolean
}

export function UploadZone({
  onUploadLocal,
  onUploadDrive,
  isUploading,
  googleConnected,
}: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [storageTarget, setStorageTarget] = useState<StorageTarget>('auto')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleUpload = () => {
    if (!selectedFile) return

    let target: 'local' | 'google_drive'
    if (storageTarget === 'auto') {
      target = googleConnected ? getAutoStorageTarget(selectedFile) : 'local'
    } else {
      target = storageTarget
    }

    if (target === 'google_drive' && !googleConnected) {
      target = 'local'
    }

    if (target === 'google_drive') {
      onUploadDrive(selectedFile)
    } else {
      onUploadLocal(selectedFile)
    }

    setSelectedFile(null)
    setStorageTarget('auto')
  }

  const resolvedTarget = selectedFile
    ? storageTarget === 'auto'
      ? googleConnected
        ? getAutoStorageTarget(selectedFile)
        : 'local'
      : storageTarget
    : null

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[8px] border-2 border-dashed p-8 transition-colors",
          dragOver
            ? "border-accent-blue bg-accent-blue/5"
            : selectedFile
              ? "border-border bg-background-secondary cursor-default"
              : "border-border bg-background-secondary hover:border-accent-blue/50 hover:bg-background-tertiary"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
            <span className="text-sm text-foreground-secondary">Uploading...</span>
          </>
        ) : selectedFile ? (
          <div className="flex w-full max-w-sm items-center gap-3">
            <File className="h-8 w-8 shrink-0 text-foreground-secondary" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-foreground-secondary">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
              }}
              className="flex h-7 w-7 items-center justify-center rounded-[4px] text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-foreground-secondary" />
            <div className="text-center">
              <span className="text-sm text-foreground">Drop files here or click to browse</span>
              <p className="mt-1 text-xs text-foreground-secondary">
                Images, videos, documents supported
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
      />

      {/* Storage target selector + upload button */}
      {selectedFile && !isUploading && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-secondary">Upload to:</span>
            <div className="flex items-center rounded-[6px] border border-border">
              <button
                onClick={() => setStorageTarget('auto')}
                className={cn(
                  "h-8 rounded-l-[6px] px-3 text-xs font-medium transition-colors",
                  storageTarget === 'auto'
                    ? "bg-accent-blue text-white"
                    : "text-foreground-secondary hover:bg-background-tertiary"
                )}
              >
                Auto
              </button>
              <button
                onClick={() => setStorageTarget('local')}
                className={cn(
                  "flex h-8 items-center gap-1.5 border-l border-border px-3 text-xs font-medium transition-colors",
                  storageTarget === 'local'
                    ? "bg-accent-blue text-white"
                    : "text-foreground-secondary hover:bg-background-tertiary"
                )}
              >
                <HardDrive className="h-3 w-3" />
                Local
              </button>
              {googleConnected && (
                <button
                  onClick={() => setStorageTarget('google_drive')}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-r-[6px] border-l border-border px-3 text-xs font-medium transition-colors",
                    storageTarget === 'google_drive'
                      ? "bg-accent-blue text-white"
                      : "text-foreground-secondary hover:bg-background-tertiary"
                  )}
                >
                  <Cloud className="h-3 w-3" />
                  Drive
                </button>
              )}
            </div>
            {resolvedTarget && (
              <span className="text-xs text-foreground-secondary">
                → {resolvedTarget === 'local' ? 'Local Storage' : 'Google Drive'}
              </span>
            )}
          </div>
          <button
            onClick={handleUpload}
            className="flex items-center gap-2 rounded-[6px] bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>
      )}
    </div>
  )
}
