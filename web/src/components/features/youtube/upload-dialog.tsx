"use client"

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Upload, File, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { YouTubePrivacyStatus } from '@/types/domain'

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (metadata: {
    title: string
    description: string
    tags: string[]
    privacyStatus: YouTubePrivacyStatus
    file: File
  }) => void
  uploadUrl: string | null
  isCreatingSession?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
  return `${bytes} B`
}

export function UploadDialog({
  open,
  onOpenChange,
  onUpload,
  uploadUrl,
  isCreatingSession,
}: UploadDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [privacyStatus, setPrivacyStatus] = useState<YouTubePrivacyStatus>('private')
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleSubmit = () => {
    if (!file || !title.trim()) return
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    onUpload({ title: title.trim(), description, tags, privacyStatus, file })
  }

  // Upload file when uploadUrl becomes available
  const lastUploadUrl = useRef<string | null>(null)
  if (uploadUrl && uploadUrl !== lastUploadUrl.current && file && uploadState === 'idle') {
    lastUploadUrl.current = uploadUrl
    setUploadState('uploading')

    const xhr = new XMLHttpRequest()
    xhrRef.current = xhr

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadState('done')
      } else {
        setUploadState('error')
      }
    })

    xhr.addEventListener('error', () => {
      setUploadState('error')
    })

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'video/*')
    xhr.send(file)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && uploadState === 'uploading') {
      // Don't allow close during upload
      return
    }
    if (!isOpen) {
      // Reset state
      setTitle('')
      setDescription('')
      setTagsInput('')
      setPrivacyStatus('private')
      setFile(null)
      setUploadState('idle')
      setProgress(0)
      lastUploadUrl.current = null
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Video File</label>
            {!file ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-border bg-background-secondary p-8 text-foreground-secondary transition-colors hover:border-accent-blue hover:text-accent-blue"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm">Click to select a video file</span>
                <span className="text-xs">MP4, MOV, AVI, MKV supported</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-[6px] border border-border bg-background-secondary p-3">
                <File className="h-5 w-5 text-foreground-secondary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-foreground-secondary">{formatFileSize(file.size)}</p>
                </div>
                {uploadState === 'idle' && (
                  <button
                    onClick={() => {
                      setFile(null)
                      setTitle('')
                    }}
                    className="p-1 text-foreground-secondary hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {uploadState === 'uploading' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-secondary">Uploading...</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background-tertiary">
                <div
                  className="h-full rounded-full bg-accent-blue transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadState === 'done' && (
            <div className="rounded-[6px] bg-accent-green/10 p-3 text-sm text-accent-green">
              Upload complete! Your video is now being processed by YouTube.
            </div>
          )}

          {uploadState === 'error' && (
            <div className="rounded-[6px] bg-accent-red/10 p-3 text-sm text-accent-red">
              Upload failed. Please try again.
            </div>
          )}

          {/* Metadata (only before upload) */}
          {uploadState === 'idle' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Video title"
                  className="h-10 w-full rounded-[6px] border border-border bg-background-secondary px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Video description"
                  className="w-full rounded-[6px] border border-border bg-background-secondary px-3 py-2 text-sm text-foreground resize-y placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tags</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="h-10 w-full rounded-[6px] border border-border bg-background-secondary px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Visibility</label>
                <div className="flex gap-2">
                  {(['private', 'unlisted', 'public'] as YouTubePrivacyStatus[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPrivacyStatus(opt)}
                      className={cn(
                        "h-9 rounded-[6px] border px-4 text-sm capitalize transition-colors",
                        privacyStatus === opt
                          ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                          : "border-border bg-background-secondary text-foreground-secondary hover:bg-background-tertiary"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {uploadState === 'done' ? (
            <button
              onClick={() => handleClose(false)}
              className="h-9 rounded-[6px] bg-accent-blue px-4 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
            >
              Done
            </button>
          ) : uploadState !== 'uploading' ? (
            <>
              <button
                onClick={() => handleClose(false)}
                className="h-9 rounded-[6px] border border-border px-4 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!file || !title.trim() || isCreatingSession}
                className="h-9 rounded-[6px] bg-accent-blue px-4 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
              >
                {isCreatingSession ? 'Preparing...' : 'Upload'}
              </button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
