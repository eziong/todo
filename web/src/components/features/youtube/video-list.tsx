import { useState } from 'react'
import { Search, Upload, ChevronRight } from 'lucide-react'
import { VideoCard } from './video-card'
import type { YouTubeVideo } from '@/types/domain'

interface VideoListProps {
  videos: YouTubeVideo[]
  totalResults: number
  hasNextPage: boolean
  search: string
  onSearchChange: (value: string) => void
  onLoadMore: () => void
  onSelectVideo: (videoId: string) => void
  onUpload: () => void
  isLoading?: boolean
}

export function VideoList({
  videos,
  totalResults,
  hasNextPage,
  search,
  onSearchChange,
  onLoadMore,
  onSelectVideo,
  onUpload,
  isLoading,
}: VideoListProps) {
  const [searchInput, setSearchInput] = useState(search)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(searchInput)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Videos</h2>
          <p className="text-sm text-foreground-secondary">
            {totalResults} video{totalResults !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onUpload}
          className="flex items-center gap-2 rounded-[6px] bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search videos..."
          className="h-10 w-full rounded-[6px] border border-border bg-background-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
        />
      </form>

      {/* Video Grid */}
      {videos.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-foreground-secondary">
          <Search className="mb-3 h-8 w-8" />
          <p className="text-sm">
            {search ? 'No videos found for this search' : 'No videos uploaded yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard
              key={video.videoId}
              video={video}
              onSelect={onSelectVideo}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-[6px] border border-border bg-background-secondary px-6 py-2 text-sm text-foreground transition-colors hover:bg-background-tertiary disabled:opacity-50"
          >
            Load More
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
