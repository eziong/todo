"use client"

import { useState } from "react"
import { 
  GripVertical, 
  ArrowRight, 
  FolderOpen, 
  ChevronDown,
  ChevronRight 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface InboxItem {
  id: string
  title: string
  timeAgo: string
  processed?: boolean
  movedTo?: string
}

const unprocessedItems: InboxItem[] = [
  { id: "1", title: "Check out Tauri for desktop app", timeAgo: "2 hours ago" },
  { id: "2", title: "YouTube 썸네일 스타일 변경 아이디어", timeAgo: "yesterday" },
  { id: "3", title: "API rate limiting 구현하기", timeAgo: "2 days ago" },
  { id: "4", title: "New mic recommendation from Reddit", timeAgo: "3 days ago" },
  { id: "5", title: "Read about WebSocket best practices", timeAgo: "4 days ago" },
]

const processedItems: InboxItem[] = [
  { id: "p1", title: "Server 모니터링 설정", timeAgo: "5 days ago", processed: true, movedTo: "Server API" },
  { id: "p2", title: "새 인트로 만들기", timeAgo: "1 week ago", processed: true, movedTo: "YouTube Channel" },
]

export function InboxContent() {
  const [inputValue, setInputValue] = useState("")
  const [inputFocused, setInputFocused] = useState(false)
  const [processedExpanded, setProcessedExpanded] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const toggleChecked = (id: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedItems(newChecked)
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
          placeholder="What's on your mind?"
          className={cn(
            "w-full resize-none rounded-[8px] border border-border bg-background-secondary px-4 py-3 text-base text-foreground placeholder:text-foreground-secondary/60 transition-all duration-200 focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue",
            inputFocused ? "h-24" : "h-12"
          )}
        />
        <span className="absolute right-3 top-3 text-xs text-foreground-secondary/50 font-mono">
          Cmd+N
        </span>
      </div>

      {/* Unprocessed items list */}
      <div className="space-y-0">
        {unprocessedItems.map((item) => (
          <InboxItemRow
            key={item.id}
            item={item}
            checked={checkedItems.has(item.id)}
            onToggleChecked={() => toggleChecked(item.id)}
          />
        ))}
      </div>

      {/* Processed section */}
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
          <span className="text-foreground-secondary/50">({processedItems.length})</span>
        </button>

        {processedExpanded && (
          <div className="mt-1 space-y-0">
            {processedItems.map((item) => (
              <ProcessedItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface InboxItemRowProps {
  item: InboxItem
  checked: boolean
  onToggleChecked: () => void
}

function InboxItemRow({ item, checked, onToggleChecked }: InboxItemRowProps) {
  return (
    <div className="group flex items-start gap-3 border-b border-[#1F1F23] px-2 py-3 transition-colors hover:bg-background-tertiary">
      {/* Drag handle */}
      <button className="mt-0.5 flex h-5 w-4 cursor-grab items-center justify-center text-foreground-secondary/30 transition-colors hover:text-foreground-secondary">
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Checkbox */}
      <button
        onClick={onToggleChecked}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          checked
            ? "border-accent-blue bg-accent-blue text-white"
            : "border-border bg-transparent hover:border-foreground-secondary"
        )}
      >
        {checked && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm text-foreground truncate",
          checked && "line-through text-foreground-secondary"
        )}>
          {item.title}
        </p>
        <p className="mt-0.5 text-xs text-foreground-secondary/60">
          Added {item.timeAgo}
        </p>
      </div>

      {/* Actions (show on hover) */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button className="flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-xs text-foreground-secondary transition-colors hover:bg-[#222226] hover:text-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Todo</span>
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-[6px] text-foreground-secondary transition-colors hover:bg-[#222226] hover:text-foreground">
          <FolderOpen className="h-4 w-4" />
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
    <div className="flex items-center gap-3 border-b border-[#1F1F23] px-2 py-3">
      {/* Spacer for alignment */}
      <div className="w-4" />

      {/* Checked checkbox (disabled) */}
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-border/50 bg-background-tertiary/50">
        <svg className="h-3 w-3 text-foreground-secondary/50" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6L5 9L10 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground-secondary/60 line-through truncate">
          {item.title}
          <span className="ml-2 no-underline text-foreground-secondary/40">
            → Moved to {item.movedTo}
          </span>
        </p>
      </div>
    </div>
  )
}
