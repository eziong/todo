'use client'

import { useState } from 'react'
import { useAvailableChannels, useSearchChannels, useSelectChannel } from '@/hooks/useYouTube'
import { useDebounce } from '@/hooks/useDebounce'
import { Youtube, Users, Video, Loader2, AlertCircle, Search } from 'lucide-react'
import type { AvailableChannel } from '@/types/domain'

interface ChannelPickerProps {
  projectId: string
  onSelected: () => void
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function ChannelCard({
  channel,
  onSelect,
  disabled,
}: {
  channel: AvailableChannel
  onSelect: (channelId: string) => void
  disabled: boolean
}) {
  return (
    <button
      onClick={() => onSelect(channel.channelId)}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-background-secondary p-4 text-left transition-colors hover:border-accent-blue/30 hover:bg-accent-blue/5 disabled:opacity-50"
    >
      {channel.thumbnailUrl ? (
        <img
          src={channel.thumbnailUrl}
          alt={channel.title ?? 'Channel'}
          className="h-10 w-10 rounded-full"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background-tertiary">
          <Youtube className="h-5 w-5 text-foreground-secondary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {channel.title ?? 'Untitled Channel'}
        </p>
        <div className="flex items-center gap-3 text-xs text-foreground-secondary">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {formatCount(channel.subscriberCount)}
          </span>
          <span className="flex items-center gap-1">
            <Video className="h-3 w-3" />
            {channel.videoCount.toLocaleString()} videos
          </span>
        </div>
      </div>
    </button>
  )
}

export function ChannelPicker({ projectId, onSelected }: ChannelPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 400)

  const { data: myChannels, isLoading: myLoading, error: myError } = useAvailableChannels(projectId)
  const { data: searchResults, isLoading: searchLoading } = useSearchChannels(projectId, debouncedQuery)
  const selectChannel = useSelectChannel(projectId)

  const handleSelect = (channelId: string) => {
    selectChannel.mutate(channelId, {
      onSuccess: () => {
        onSelected()
      },
    })
  }

  if (myLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-foreground-secondary" />
        <p className="text-sm text-foreground-secondary">Loading channels...</p>
      </div>
    )
  }

  if (myError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-8 w-8 text-accent-red" />
        <p className="text-sm text-foreground-secondary">Failed to load channels. Please try again.</p>
      </div>
    )
  }

  const isSearching = debouncedQuery.trim().length > 0
  const displayChannels = isSearching ? searchResults : myChannels

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-red/10">
        <Youtube className="h-8 w-8 text-accent-red" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Select a Channel</h2>
        <p className="mt-1 max-w-sm text-sm text-foreground-secondary">
          Choose which YouTube channel to use for this project.
        </p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search channels by name..."
          className="h-10 w-full rounded-lg border border-border bg-background-secondary pl-10 pr-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
        />
      </div>

      {/* Channel list */}
      <div className="w-full max-w-md space-y-2">
        {/* My channels section */}
        {!isSearching && myChannels && myChannels.length > 0 && (
          <>
            <p className="px-1 text-xs font-medium uppercase tracking-wider text-foreground-secondary">
              My Channels
            </p>
            {myChannels.map((ch) => (
              <ChannelCard
                key={ch.channelId}
                channel={ch}
                onSelect={handleSelect}
                disabled={selectChannel.isPending}
              />
            ))}
          </>
        )}

        {/* Search results */}
        {isSearching && (
          <>
            <p className="px-1 text-xs font-medium uppercase tracking-wider text-foreground-secondary">
              Search Results
            </p>
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-foreground-secondary" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((ch) => (
                <ChannelCard
                  key={ch.channelId}
                  channel={ch}
                  onSelect={handleSelect}
                  disabled={selectChannel.isPending}
                />
              ))
            ) : (
              <p className="py-4 text-center text-sm text-foreground-secondary">
                No channels found for "{debouncedQuery}"
              </p>
            )}
          </>
        )}

        {/* Empty state */}
        {!isSearching && (!myChannels || myChannels.length === 0) && (
          <div className="py-4 text-center">
            <p className="text-sm text-foreground-secondary">
              No channels found for your account. Search for a channel above.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
