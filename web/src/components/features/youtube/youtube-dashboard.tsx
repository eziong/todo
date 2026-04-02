import { Users, Eye, Film, ArrowRight } from 'lucide-react'
import { VideoCard } from './video-card'
import type { YouTubeVideo } from '@/types/domain'

function formatLargeNumber(num: number | null): string {
  if (num === null) return '—'
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

interface ChannelStats {
  channelTitle: string | null
  thumbnailUrl: string | null
  subscriberCount: number | null
  videoCount: number | null
  viewCount: number | null
}

interface YouTubeDashboardProps {
  channel: ChannelStats
  recentVideos: YouTubeVideo[]
  onSelectVideo: (videoId: string) => void
  onNavigateToVideos: () => void
  onNavigateToComments: () => void
}

export function YouTubeDashboard({
  channel,
  recentVideos,
  onSelectVideo,
  onNavigateToVideos,
  onNavigateToComments,
}: YouTubeDashboardProps) {
  const stats = [
    { label: 'Subscribers', value: formatLargeNumber(channel.subscriberCount), icon: Users },
    { label: 'Total Views', value: formatLargeNumber(channel.viewCount), icon: Eye },
    { label: 'Videos', value: formatLargeNumber(channel.videoCount), icon: Film },
  ]

  return (
    <div className="space-y-6">
      {/* Channel Header */}
      <div className="flex items-center gap-4">
        {channel.thumbnailUrl && (
          <img
            src={channel.thumbnailUrl}
            alt={channel.channelTitle ?? 'Channel'}
            className="h-14 w-14 rounded-full"
          />
        )}
        <div>
          <h2 className="text-lg font-semibold text-foreground">{channel.channelTitle}</h2>
          <p className="text-sm text-foreground-secondary">YouTube Channel</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-background-secondary p-4"
          >
            <div className="flex items-center gap-2 text-foreground-secondary">
              <stat.icon className="h-4 w-4" />
              <span className="text-sm">{stat.label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={onNavigateToVideos}
          className="flex items-center gap-2 rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm text-foreground transition-colors hover:bg-background-tertiary"
        >
          <Film className="h-4 w-4" />
          Manage Videos
          <ArrowRight className="h-3.5 w-3.5 text-foreground-secondary" />
        </button>
        <button
          onClick={onNavigateToComments}
          className="flex items-center gap-2 rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm text-foreground transition-colors hover:bg-background-tertiary"
        >
          Comments
          <ArrowRight className="h-3.5 w-3.5 text-foreground-secondary" />
        </button>
      </div>

      {/* Recent Videos */}
      {recentVideos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground-secondary uppercase tracking-wider">
              Recent Videos
            </h3>
            <button
              onClick={onNavigateToVideos}
              className="text-xs text-accent-blue hover:underline"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentVideos.map((video) => (
              <VideoCard
                key={video.videoId}
                video={video}
                onSelect={onSelectVideo}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
