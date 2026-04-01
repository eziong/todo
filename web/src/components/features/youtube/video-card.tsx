import { Eye, ThumbsUp, MessageSquare, Lock, Globe, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { YouTubeVideo, YouTubePrivacyStatus } from '@/types/domain'

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

function formatDuration(iso8601: string): string {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return ''
  const h = match[1] ? `${match[1]}:` : ''
  const m = match[2] ?? '0'
  const s = (match[3] ?? '0').padStart(2, '0')
  return `${h}${h ? m.padStart(2, '0') : m}:${s}`
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

const privacyConfig: Record<YouTubePrivacyStatus, { icon: React.ElementType; label: string; className: string }> = {
  public: { icon: Globe, label: 'Public', className: 'text-accent-green' },
  unlisted: { icon: EyeOff, label: 'Unlisted', className: 'text-accent-yellow' },
  private: { icon: Lock, label: 'Private', className: 'text-foreground-secondary' },
}

interface VideoCardProps {
  video: YouTubeVideo
  onSelect: (videoId: string) => void
}

export function VideoCard({ video, onSelect }: VideoCardProps) {
  const privacy = privacyConfig[video.privacyStatus]
  const PrivacyIcon = privacy.icon

  return (
    <button
      onClick={() => onSelect(video.videoId)}
      className="group w-full text-left space-y-2"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-[8px] bg-background-tertiary">
        {video.thumbnailUrl && (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        )}
        {/* Duration badge */}
        {video.duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-accent-blue transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-foreground-secondary">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatCount(video.viewCount)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {formatCount(video.likeCount)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {formatCount(video.commentCount)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn('flex items-center gap-1', privacy.className)}>
            <PrivacyIcon className="h-3 w-3" />
            {privacy.label}
          </span>
          <span className="text-foreground-secondary">{formatRelativeDate(video.publishedAt)}</span>
        </div>
      </div>
    </button>
  )
}
