"use client"

import { useState } from 'react'
import { ThumbsUp, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { YouTubeComment } from '@/types/domain'

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

interface CommentItemProps {
  comment: YouTubeComment
  onReply: (commentId: string, text: string) => void
  isReplying?: boolean
}

export function CommentItem({ comment, onReply, isReplying }: CommentItemProps) {
  const [replyText, setReplyText] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [showReplies, setShowReplies] = useState(false)

  const handleSubmitReply = () => {
    if (!replyText.trim()) return
    onReply(comment.commentId, replyText.trim())
    setReplyText('')
    setShowReplyInput(false)
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background-secondary p-4">
      {/* Comment Header */}
      <div className="flex items-start gap-3">
        {comment.authorProfileUrl && (
          <img
            src={comment.authorProfileUrl}
            alt={comment.authorName}
            className="h-8 w-8 rounded-full"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{comment.authorName}</span>
            <span className="text-xs text-foreground-secondary">
              {formatRelativeDate(comment.publishedAt)}
            </span>
            {!comment.isOwnerReplied && (
              <span className="rounded bg-accent-orange/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-orange">
                Unanswered
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-foreground-secondary">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" /> {comment.likeCount}
            </span>
            {comment.totalReplyCount > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-accent-blue hover:underline"
              >
                <MessageSquare className="h-3 w-3" />
                {comment.totalReplyCount} {comment.totalReplyCount === 1 ? 'reply' : 'replies'}
                {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-accent-blue hover:underline"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Existing Replies */}
      {showReplies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-border pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.replyId} className="flex items-start gap-2">
              {reply.authorProfileUrl && (
                <img
                  src={reply.authorProfileUrl}
                  alt={reply.authorName}
                  className="h-6 w-6 rounded-full"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{reply.authorName}</span>
                  <span className="text-[10px] text-foreground-secondary">
                    {formatRelativeDate(reply.publishedAt)}
                  </span>
                </div>
                <p className="text-xs text-foreground whitespace-pre-wrap">{reply.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Input */}
      {showReplyInput && (
        <div className="ml-11 flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSubmitReply()
              }
            }}
            placeholder="Write a reply..."
            className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            disabled={isReplying}
          />
          <button
            onClick={handleSubmitReply}
            disabled={!replyText.trim() || isReplying}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              replyText.trim()
                ? "bg-accent-blue text-white hover:bg-accent-blue/90"
                : "bg-background-tertiary text-foreground-secondary"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
