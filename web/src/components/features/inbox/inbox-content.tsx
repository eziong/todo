"use client"

import { useState } from "react"
import {
  ArrowRight,
  Trash2,
  ChevronDown,
  ChevronRight,
  Inbox,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { InboxItemId } from "@/types/branded"
import type { InboxItem, CreateInboxItemInput, ProcessInboxItemInput } from "@/types/domain"

// --- Time formatting ---

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// --- Props ---

interface InboxContentProps {
  items: InboxItem[]
  onCreateItem: (input: CreateInboxItemInput) => void
  onProcessItem: (id: InboxItemId, input: ProcessInboxItemInput) => void
  onDeleteItem: (id: InboxItemId) => void
  isCreating: boolean
}

export function InboxContent({
  items,
  onCreateItem,
  onProcessItem,
  onDeleteItem,
  isCreating,
}: InboxContentProps) {
  const [inputValue, setInputValue] = useState("")
  const [inputFocused, setInputFocused] = useState(false)
  const [processedExpanded, setProcessedExpanded] = useState(false)

  const unprocessedItems = items.filter((item) => !item.processed)
  const processedItems = items.filter((item) => item.processed)

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    onCreateItem({ content: trimmed })
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleProcessToTodo = (item: InboxItem) => {
    onProcessItem(item.id, {
      processedTo: "todo",
      title: item.content,
    })
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Inbox</h1>
        <span className="flex h-6 items-center rounded-[4px] bg-background-tertiary px-2 text-sm text-foreground-secondary">
          {unprocessedItems.length} items
        </span>
      </div>

      {/* Quick add section */}
      <div className="relative">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind?"
          disabled={isCreating}
          className={cn(
            "w-full resize-none rounded-[8px] border border-border bg-background-secondary px-4 py-3 text-base text-foreground placeholder:text-foreground-secondary/60 transition-all duration-200 focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue disabled:opacity-50",
            inputFocused ? "h-24" : "h-12"
          )}
        />
        <span className="absolute right-3 top-3 text-xs text-foreground-secondary/50 font-mono">
          Cmd+N
        </span>
      </div>

      {/* Unprocessed items */}
      {unprocessedItems.length === 0 && processedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-tertiary">
            <Inbox className="h-6 w-6 text-foreground-secondary" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">Inbox is empty</p>
          <p className="mt-1 text-sm text-foreground-secondary">
            Capture ideas and thoughts quickly. Process them later.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-0">
            {unprocessedItems.map((item) => (
              <InboxItemRow
                key={item.id}
                item={item}
                onProcessToTodo={() => handleProcessToTodo(item)}
                onDelete={() => onDeleteItem(item.id)}
              />
            ))}
          </div>

          {/* Processed section */}
          {processedItems.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setProcessedExpanded(!processedExpanded)}
                className="flex w-full items-center gap-2 py-2 text-sm text-foreground-secondary transition-colors hover:text-foreground"
              >
                {processedExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>Processed</span>
                <span className="text-foreground-secondary/50">
                  ({processedItems.length})
                </span>
              </button>

              {processedExpanded && (
                <div className="mt-1 space-y-0">
                  {processedItems.map((item) => (
                    <ProcessedItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// --- Sub-components ---

interface InboxItemRowProps {
  item: InboxItem
  onProcessToTodo: () => void
  onDelete: () => void
}

function InboxItemRow({ item, onProcessToTodo, onDelete }: InboxItemRowProps) {
  return (
    <div className="group flex items-start gap-3 border-b border-border px-2 py-3 transition-colors hover:bg-background-tertiary">
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{item.content}</p>
        <p className="mt-0.5 text-xs text-foreground-secondary/60">
          Added {formatTimeAgo(item.createdAt)}
        </p>
      </div>

      {/* Actions (show on hover) */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onProcessToTodo}
          className="flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-xs text-foreground-secondary transition-colors hover:bg-background-secondary hover:text-foreground"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Todo</span>
        </button>
        <button
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-[6px] text-foreground-secondary transition-colors hover:bg-accent-red/10 hover:text-accent-red"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

interface ProcessedItemRowProps {
  item: InboxItem
}

function ProcessedItemRow({ item }: ProcessedItemRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-2 py-3">
      {/* Spacer for alignment */}
      <div className="w-4" />

      {/* Checked indicator */}
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-border/50 bg-background-tertiary/50">
        <Check className="h-3 w-3 text-foreground-secondary/50" strokeWidth={2.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground-secondary/60 line-through truncate">
          {item.content}
          {item.processedTo && (
            <span className="ml-2 no-underline text-foreground-secondary/40">
              → Moved to {item.processedTo}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
