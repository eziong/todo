'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useGoogleConnection, useConnectYouTube } from '@/hooks/useGoogleAuth'
import { useYouTubeChannel, useYouTubeVideos } from '@/hooks/useYouTube'
import { YouTubeDashboard } from '@/components/features/youtube/youtube-dashboard'
import { YouTubeSkeleton } from '@/components/features/youtube/youtube-skeleton'
import { ChannelPicker } from '@/components/features/youtube/channel-picker'
import { classifyError } from '@/lib/errors'
import { Youtube, ExternalLink } from 'lucide-react'

function ConnectCTA({ onConnect, isPending }: { onConnect: () => void; isPending: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-red/10">
        <Youtube className="h-8 w-8 text-accent-red" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Connect YouTube</h2>
        <p className="mt-1 max-w-sm text-sm text-foreground-secondary">
          Connect your YouTube channel to view analytics, manage videos, and reply to comments.
        </p>
      </div>
      <button
        onClick={onConnect}
        disabled={isPending}
        className="flex items-center gap-2 rounded-[6px] bg-accent-blue px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
      >
        {isPending ? 'Connecting...' : 'Connect YouTube'}
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function ProjectYouTubePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id

  const [showChannelPicker, setShowChannelPicker] = useState(false)

  const { data: connection, isLoading: connectionLoading } = useGoogleConnection(projectId)
  const connectYouTube = useConnectYouTube(projectId)
  const { data: channel, isLoading: channelLoading, error: channelError, refetch } = useYouTubeChannel(projectId)
  const { data: videosData } = useYouTubeVideos(projectId, { maxResults: 6 })

  // Handle ?connected=youtube and ?selectChannel=true params
  useEffect(() => {
    const connected = searchParams.get('connected')
    const selectChannel = searchParams.get('selectChannel')

    if (connected === 'youtube') {
      toast.success('YouTube connected successfully')
    }

    if (selectChannel === 'true') {
      setShowChannelPicker(true)
    }

    if (connected || selectChannel) {
      window.history.replaceState({}, '', `/projects/${projectId}/youtube`)
    }
  }, [searchParams, projectId])

  if (connectionLoading) return <YouTubeSkeleton />

  if (!connection?.youtubeConnected) {
    return <ConnectCTA onConnect={() => connectYouTube.mutate()} isPending={connectYouTube.isPending} />
  }

  // Show channel picker if no channel selected or explicitly requested
  if (showChannelPicker || (!channelLoading && !channel && !channelError)) {
    return (
      <ChannelPicker
        projectId={projectId}
        onSelected={() => setShowChannelPicker(false)}
      />
    )
  }

  if (channelLoading) return <YouTubeSkeleton />

  if (channelError && !channel) {
    const classified = classifyError(channelError)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-foreground">{classified.title}</p>
        <p className="text-sm text-foreground-secondary">{classified.message}</p>
        {classified.retryable && (
          <button
            onClick={() => refetch()}
            className="rounded-[6px] bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  return (
    <YouTubeDashboard
      channel={{
        channelTitle: channel?.channelTitle ?? null,
        thumbnailUrl: channel?.thumbnailUrl ?? null,
        subscriberCount: channel?.subscriberCount ?? null,
        videoCount: channel?.videoCount ?? null,
        viewCount: channel?.viewCount ?? null,
      }}
      recentVideos={videosData?.videos ?? []}
      onSelectVideo={(videoId) => router.push(`/projects/${projectId}/youtube/videos?video=${videoId}`)}
      onNavigateToVideos={() => router.push(`/projects/${projectId}/youtube/videos`)}
      onNavigateToComments={() => router.push(`/projects/${projectId}/youtube/comments`)}
    />
  )
}
