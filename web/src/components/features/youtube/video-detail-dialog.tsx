"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Eye, ThumbsUp, MessageSquare, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { YouTubeVideo, YouTubePrivacyStatus } from '@/types/domain'

interface VideoDetailDialogProps {
  video: YouTubeVideo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (videoId: string, data: {
    title: string
    description: string
    tags: string[]
    privacyStatus: YouTubePrivacyStatus
  }) => void
  onLinkToContent?: (videoId: string) => void
  isSaving?: boolean
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

const privacyOptions: { value: YouTubePrivacyStatus; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
]

export function VideoDetailDialog({
  video,
  open,
  onOpenChange,
  onSave,
  onLinkToContent,
  isSaving,
}: VideoDetailDialogProps) {
  const [title, setTitle] = useState(video?.title ?? '')
  const [description, setDescription] = useState(video?.description ?? '')
  const [tagsInput, setTagsInput] = useState(video?.tags?.join(', ') ?? '')
  const [privacyStatus, setPrivacyStatus] = useState<YouTubePrivacyStatus>(
    video?.privacyStatus ?? 'private'
  )

  // Reset form when video changes
  const videoId = video?.videoId
  const [lastVideoId, setLastVideoId] = useState(videoId)
  if (videoId !== lastVideoId) {
    setLastVideoId(videoId)
    setTitle(video?.title ?? '')
    setDescription(video?.description ?? '')
    setTagsInput(video?.tags?.join(', ') ?? '')
    setPrivacyStatus(video?.privacyStatus ?? 'private')
  }

  const handleSave = () => {
    if (!video) return
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    onSave(video.videoId, { title, description, tags, privacyStatus })
  }

  if (!video) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Thumbnail + Stats */}
          <div className="flex gap-4">
            {video.thumbnailUrl && (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="h-24 w-auto rounded-lg object-cover"
              />
            )}
            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {formatCount(video.viewCount)}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" /> {formatCount(video.likeCount)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> {formatCount(video.commentCount)}
                </span>
              </div>
              <a
                href={`https://youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-accent-blue hover:underline"
              >
                View on YouTube <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background-secondary px-3 text-sm text-foreground focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground resize-y focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tags</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="h-10 w-full rounded-lg border border-border bg-background-secondary px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
            <p className="text-xs text-foreground-secondary">Separate tags with commas</p>
          </div>

          {/* Privacy Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Visibility</label>
            <div className="flex gap-2">
              {privacyOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPrivacyStatus(opt.value)}
                  className={cn(
                    "flex h-9 items-center rounded-lg border px-4 text-sm transition-colors",
                    privacyStatus === opt.value
                      ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                      : "border-border bg-background-secondary text-foreground-secondary hover:bg-background-tertiary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Link to Content */}
          {onLinkToContent && (
            <button
              onClick={() => onLinkToContent(video.videoId)}
              className="flex items-center gap-2 text-sm text-accent-blue hover:underline"
            >
              Link to Content Pipeline
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg border border-border px-4 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="h-9 rounded-lg bg-accent-blue px-4 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
