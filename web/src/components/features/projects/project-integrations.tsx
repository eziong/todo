'use client'

import { useRouter } from 'next/navigation'
import {
  Youtube,
  HardDrive,
  Check,
  Unplug,
  Users,
  Video,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import {
  useGoogleConnection,
  useConnectYouTube,
  useConnectDrive,
  useDisconnectYouTube,
  useDisconnectDrive,
} from '@/hooks/useGoogleAuth'

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

interface ProjectIntegrationsProps {
  projectId: string
}

export function ProjectIntegrations({ projectId }: ProjectIntegrationsProps) {
  const router = useRouter()
  const { data: connection } = useGoogleConnection(projectId)
  const connectYouTube = useConnectYouTube(projectId)
  const connectDrive = useConnectDrive(projectId)
  const disconnectYouTube = useDisconnectYouTube(projectId)
  const disconnectDrive = useDisconnectDrive(projectId)

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Connect external services to this project.
        </p>
      </div>
      <div className="space-y-3">
        {/* YouTube */}
        <div className="rounded-xl border border-border bg-background-secondary">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-tertiary">
                  <Youtube className="h-5 w-5 text-foreground-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">YouTube</p>
                  {connection?.youtubeConnected ? (
                    <p className="flex items-center gap-1 text-xs text-accent-green">
                      <Check className="h-3 w-3" />
                      Connected
                    </p>
                  ) : (
                    <p className="text-xs text-foreground-secondary">Not connected</p>
                  )}
                </div>
              </div>
              {connection?.youtubeConnected ? (
                <button
                  onClick={() => disconnectYouTube.mutate()}
                  disabled={disconnectYouTube.isPending}
                  className="flex h-8 items-center gap-2 rounded-lg border border-accent-red/30 px-3 text-sm text-accent-red transition-colors hover:bg-accent-red/10 disabled:opacity-50"
                >
                  <Unplug className="h-3.5 w-3.5" />
                  {disconnectYouTube.isPending ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => connectYouTube.mutate()}
                  disabled={connectYouTube.isPending}
                  className="flex h-8 items-center gap-2 rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground-secondary transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {connectYouTube.isPending ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {/* Channel details */}
            {connection?.youtubeConnected && connection.channelTitle && (
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  {connection.thumbnailUrl ? (
                    <img
                      src={connection.thumbnailUrl}
                      alt={connection.channelTitle}
                      className="h-9 w-9 rounded-full"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background-tertiary">
                      <Youtube className="h-4 w-4 text-foreground-secondary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {connection.channelTitle}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-foreground-secondary">
                      {connection.subscriberCount != null && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatCount(connection.subscriberCount)}
                        </span>
                      )}
                      {connection.videoCount != null && (
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          {connection.videoCount.toLocaleString()} videos
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/projects/${projectId}/youtube?selectChannel=true`)}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>

        {/* Google Drive */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-background-secondary p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-tertiary">
                <HardDrive className="h-5 w-5 text-foreground-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Google Drive</p>
                {connection?.driveConnected ? (
                  <p className="flex items-center gap-1 text-xs text-accent-green">
                    <Check className="h-3 w-3" />
                    Connected
                  </p>
                ) : (
                  <p className="text-xs text-foreground-secondary">Not connected</p>
                )}
              </div>
            </div>
            {connection?.driveConnected ? (
              <button
                onClick={() => disconnectDrive.mutate()}
                disabled={disconnectDrive.isPending}
                className="flex h-8 items-center gap-2 rounded-lg border border-accent-red/30 px-3 text-sm text-accent-red transition-colors hover:bg-accent-red/10 disabled:opacity-50"
              >
                <Unplug className="h-3.5 w-3.5" />
                {disconnectDrive.isPending ? 'Disconnecting...' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={() => connectDrive.mutate()}
                disabled={connectDrive.isPending}
                className="flex h-8 items-center gap-2 rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground-secondary transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {connectDrive.isPending ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
      </div>
    </section>
  )
}
