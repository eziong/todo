"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  MoreHorizontal,
  ArrowRight,
  Trash2,
  Calendar,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { ContentStage, ContentWithDetails } from "@/types/domain"

const STAGES: ContentStage[] = [
  'idea', 'drafting', 'editing', 'review', 'published',
]

const STAGE_LABELS: Record<ContentStage, string> = {
  idea: 'Idea',
  drafting: 'Drafting',
  editing: 'Editing',
  review: 'Review',
  published: 'Published',
}

const TYPE_COLORS: Record<string, string> = {
  video: 'bg-accent-blue/15 text-accent-blue',
  short: 'bg-accent-purple/15 text-accent-purple',
  post: 'bg-accent-green/15 text-accent-green',
  blog: 'bg-accent-orange/15 text-accent-orange',
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-500/15 text-red-400',
  instagram: 'bg-pink-500/15 text-pink-400',
  twitter: 'bg-sky-500/15 text-sky-400',
  blog: 'bg-accent-orange/15 text-accent-orange',
  other: 'bg-background-tertiary text-foreground-secondary',
}

interface ContentCardProps {
  content: ContentWithDetails
  onStageChange: (id: string, stage: ContentStage) => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function ContentCard({ content, onStageChange, onSelect, onDelete }: ContentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: content.id as string })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border border-border bg-background p-3 transition-colors hover:border-foreground-secondary/30 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      onClick={() => onSelect(content.id as string)}
      {...attributes}
      {...listeners}
    >
      <ContentCardBody content={content} />

      {/* Menu */}
      <div
        className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-6 w-6 items-center justify-center rounded-full text-foreground-secondary hover:bg-background-tertiary hover:text-foreground">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRight className="mr-2 h-4 w-4" />
                Move to stage
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {STAGES.filter((s) => s !== content.stage).map((stage) => (
                  <DropdownMenuItem
                    key={stage}
                    onClick={() => onStageChange(content.id as string, stage)}
                  >
                    {STAGE_LABELS[stage]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-accent-red focus:text-accent-red"
              onClick={() => onDelete(content.id as string)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/** Drag overlay version — no sortable hooks, just the visual */
export function ContentCardOverlay({ content }: { content: ContentWithDetails }) {
  return (
    <div className="w-[220px] rounded-lg border border-accent-blue/50 bg-background p-3 shadow-lg shadow-black/20">
      <ContentCardBody content={content} />
    </div>
  )
}

function ContentCardBody({ content }: { content: ContentWithDetails }) {
  const scheduledDate = content.scheduledAt
    ? new Date(content.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <>
      {/* Title */}
      <p className="text-sm font-medium text-foreground line-clamp-2">{content.title}</p>

      {/* Type + Platform badges */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", TYPE_COLORS[content.type])}>
          {content.type}
        </span>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", PLATFORM_COLORS[content.platform])}>
          {content.platform}
        </span>
      </div>

      {/* Project dot + date + checklist */}
      <div className="mt-2 flex items-center gap-2 text-[11px] text-foreground-secondary">
        {content.projectName && (
          <div className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: content.projectColor ?? '#6b7280' }}
            />
            <span className="truncate max-w-[60px]">{content.projectName}</span>
          </div>
        )}
        {scheduledDate && (
          <div className="flex items-center gap-0.5">
            <Calendar className="h-3 w-3" />
            <span>{scheduledDate}</span>
          </div>
        )}
      </div>
    </>
  )
}

export { STAGES, STAGE_LABELS, TYPE_COLORS, PLATFORM_COLORS }
