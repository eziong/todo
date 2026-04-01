import { MessageSquare, Filter } from 'lucide-react'
import { CommentItem } from './comment-item'
import { cn } from '@/lib/utils'
import type { YouTubeComment, YouTubeVideo } from '@/types/domain'

interface CommentListProps {
  comments: YouTubeComment[]
  totalResults: number
  videos: YouTubeVideo[]
  selectedVideoId: string | null
  filter: 'all' | 'unanswered'
  onSelectVideo: (videoId: string) => void
  onFilterChange: (filter: 'all' | 'unanswered') => void
  onReply: (commentId: string, text: string) => void
  onLoadMore?: () => void
  hasNextPage?: boolean
  isReplying?: boolean
  isLoading?: boolean
}

export function CommentList({
  comments,
  totalResults,
  videos,
  selectedVideoId,
  filter,
  onSelectVideo,
  onFilterChange,
  onReply,
  onLoadMore,
  hasNextPage,
  isReplying,
  isLoading,
}: CommentListProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Comments</h2>
        <p className="text-sm text-foreground-secondary">
          {totalResults} comment{totalResults !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Video Selector + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={selectedVideoId ?? ''}
          onChange={(e) => onSelectVideo(e.target.value)}
          className="h-10 rounded-[6px] border border-border bg-background-secondary px-3 text-sm text-foreground focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
        >
          <option value="" disabled>Select a video...</option>
          {videos.map((video) => (
            <option key={video.videoId} value={video.videoId}>
              {video.title}
            </option>
          ))}
        </select>

        <div className="flex gap-1 rounded-[6px] border border-border bg-background-secondary p-0.5">
          {(['all', 'unanswered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={cn(
                "flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-sm transition-colors capitalize",
                filter === f
                  ? "bg-background-tertiary text-foreground"
                  : "text-foreground-secondary hover:text-foreground"
              )}
            >
              {f === 'unanswered' && <Filter className="h-3.5 w-3.5" />}
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* No video selected */}
      {!selectedVideoId && (
        <div className="flex flex-col items-center justify-center py-16 text-foreground-secondary">
          <MessageSquare className="mb-3 h-8 w-8" />
          <p className="text-sm">Select a video to view comments</p>
        </div>
      )}

      {/* Loading */}
      {selectedVideoId && isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
        </div>
      )}

      {/* Comments */}
      {selectedVideoId && !isLoading && comments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-foreground-secondary">
          <MessageSquare className="mb-3 h-8 w-8" />
          <p className="text-sm">
            {filter === 'unanswered' ? 'All comments have been answered' : 'No comments on this video'}
          </p>
        </div>
      )}

      {selectedVideoId && !isLoading && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              onReply={onReply}
              isReplying={isReplying}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasNextPage && onLoadMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            className="rounded-[6px] border border-border bg-background-secondary px-6 py-2 text-sm text-foreground transition-colors hover:bg-background-tertiary"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
