"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { Plus, Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ContentCard, ContentCardOverlay, STAGES, STAGE_LABELS } from "./content-card"
import type { ContentStage, ContentType, ContentPlatform, ContentFilters, ContentWithDetails, MoveContentInput } from "@/types/domain"
import type { ProjectWithStats } from "@/types/domain"

const CONTENT_TYPES: ContentType[] = ['video', 'short', 'post', 'blog']
const CONTENT_PLATFORMS: ContentPlatform[] = ['youtube', 'instagram', 'twitter', 'blog', 'other']

const STAGE_COLORS: Record<ContentStage, string> = {
  idea: 'bg-foreground-secondary/20',
  drafting: 'bg-accent-blue/20',
  editing: 'bg-accent-yellow/20',
  review: 'bg-accent-green/20',
  published: 'bg-accent-blue/30',
}

const kanbanCollisionDetection: CollisionDetection = (args) => {
  // First, find which column the pointer is inside using pointerWithin
  const pointerCollisions = pointerWithin(args)
  const columnHit = pointerCollisions.find((c) =>
    String(c.id).startsWith('column-')
  )

  if (!columnHit) {
    // Pointer isn't over any column — fall back to closestCorners
    return closestCorners(args)
  }

  // Filter droppable containers to only those in the target column
  const targetStage = String(columnHit.id).replace('column-', '')
  const filteredContainers = args.droppableContainers.filter((container) => {
    const id = String(container.id)
    return id === `column-${targetStage}` || args.active.id !== id && (() => {
      // Check if this sortable item belongs to the target column
      // by looking at droppableRects — items in the same column share x-range with the column
      const columnRect = args.droppableRects.get(columnHit.id)
      const itemRect = args.droppableRects.get(container.id)
      if (!columnRect || !itemRect) return false
      // Item is in this column if its horizontal center is within the column rect
      const itemCenterX = itemRect.left + itemRect.width / 2
      return itemCenterX >= columnRect.left && itemCenterX <= columnRect.right
    })()
  })

  if (filteredContainers.length === 0) {
    return [columnHit]
  }

  // Run closestCorners on only the filtered containers
  const result = closestCorners({
    ...args,
    droppableContainers: filteredContainers,
  })

  return result.length > 0 ? result : [columnHit]
}

interface PipelineBoardProps {
  contents: ContentWithDetails[]
  projects: ProjectWithStats[]
  filters: ContentFilters
  onFiltersChange: (filters: ContentFilters) => void
  onStageChange: (id: string, stage: ContentStage) => void
  onMoveContent: (input: MoveContentInput) => void
  onCreateContent: () => void
  onDeleteContent: (id: string) => void
  onSelectContent: (id: string) => void
  isCreating: boolean
}

function DroppableColumn({
  stage,
  stageContents,
  onStageChange,
  onSelectContent,
  onDeleteContent,
}: {
  stage: ContentStage
  stageContents: ContentWithDetails[]
  onStageChange: (id: string, stage: ContentStage) => void
  onSelectContent: (id: string) => void
  onDeleteContent: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${stage}` })

  return (
    <div
      key={stage}
      className="min-w-0 flex-1 flex flex-col rounded-[8px] bg-background-secondary/50"
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-xs font-medium text-foreground-secondary">
          {STAGE_LABELS[stage]}
        </span>
        <span className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium text-foreground-secondary",
          STAGE_COLORS[stage],
        )}>
          {stageContents.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 px-2 pb-2 min-h-[80px] rounded-b-[8px] transition-colors",
          isOver && "bg-accent-blue/5"
        )}
      >
        <SortableContext
          items={stageContents.map((c) => c.id as string)}
          strategy={verticalListSortingStrategy}
        >
          {stageContents.length === 0 ? (
            <div className="flex items-center justify-center rounded-[6px] border border-dashed border-border py-6">
              <span className="text-[11px] text-foreground-secondary/50">Empty</span>
            </div>
          ) : (
            stageContents.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onStageChange={onStageChange}
                onSelect={onSelectContent}
                onDelete={onDeleteContent}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export function PipelineBoard({
  contents,
  projects,
  filters,
  onFiltersChange,
  onStageChange,
  onMoveContent,
  onCreateContent,
  onDeleteContent,
  onSelectContent,
  isCreating,
}: PipelineBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  )

  const sortedContentsByStage = (stage: ContentStage) =>
    contents
      .filter((c) => c.stage === stage)
      .sort((a, b) => {
        if (a.position !== null && b.position !== null) return a.position < b.position ? -1 : a.position > b.position ? 1 : 0
        if (a.position !== null) return -1
        if (b.position !== null) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

  const findContentStage = (contentId: string): ContentStage | null => {
    const content = contents.find((c) => (c.id as string) === contentId)
    return content?.stage ?? null
  }

  const findColumnFromDroppableId = (droppableId: string): ContentStage | null => {
    if (droppableId.startsWith('column-')) {
      return droppableId.replace('column-', '') as ContentStage
    }
    return findContentStage(droppableId)
  }

  const activeContent = activeId
    ? contents.find((c) => (c.id as string) === activeId) ?? null
    : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeContentId = active.id as string
    const overId = over.id as string

    const sourceStage = findContentStage(activeContentId)
    const targetStage = findColumnFromDroppableId(overId)

    if (!sourceStage || !targetStage) return

    if (sourceStage === targetStage) {
      // Same column reorder
      const columnItems = sortedContentsByStage(sourceStage)
      const oldIndex = columnItems.findIndex((c) => (c.id as string) === activeContentId)
      const newIndex = columnItems.findIndex((c) => (c.id as string) === overId)

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = arrayMove(columnItems, oldIndex, newIndex)
      const movedIndex = reordered.findIndex((c) => (c.id as string) === activeContentId)
      const afterId = movedIndex > 0 ? (reordered[movedIndex - 1].id as string) : undefined
      const beforeId = movedIndex < reordered.length - 1 ? (reordered[movedIndex + 1].id as string) : undefined

      onMoveContent({ id: activeContentId, afterId, beforeId })
    } else {
      // Cross-column move
      const targetItems = sortedContentsByStage(targetStage)
      let insertIndex: number

      if (overId.startsWith('column-')) {
        insertIndex = targetItems.length
      } else {
        const overIndex = targetItems.findIndex((c) => (c.id as string) === overId)
        insertIndex = overIndex >= 0 ? overIndex : targetItems.length
      }

      const afterId = insertIndex > 0 ? (targetItems[insertIndex - 1].id as string) : undefined
      const beforeId = insertIndex < targetItems.length ? (targetItems[insertIndex].id as string) : undefined

      onMoveContent({ id: activeContentId, stage: targetStage, afterId, beforeId })
    }
  }

  const hasActiveFilters = Boolean(filters.type || filters.platform || filters.projectId)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border py-4">
        <h1 className="text-lg font-semibold text-foreground">Content Pipeline</h1>
        <div className="flex items-center gap-2">
          {/* Type filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex h-9 items-center gap-1.5 rounded-[6px] border border-border px-3 text-sm transition-colors hover:bg-background-tertiary",
                filters.type ? "text-foreground" : "text-foreground-secondary"
              )}>
                {filters.type ?? "Type"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, type: undefined })}>
                All Types
              </DropdownMenuItem>
              {CONTENT_TYPES.map((type) => (
                <DropdownMenuItem key={type} onClick={() => onFiltersChange({ ...filters, type })}>
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Platform filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex h-9 items-center gap-1.5 rounded-[6px] border border-border px-3 text-sm transition-colors hover:bg-background-tertiary",
                filters.platform ? "text-foreground" : "text-foreground-secondary"
              )}>
                {filters.platform ?? "Platform"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, platform: undefined })}>
                All Platforms
              </DropdownMenuItem>
              {CONTENT_PLATFORMS.map((platform) => (
                <DropdownMenuItem key={platform} onClick={() => onFiltersChange({ ...filters, platform })}>
                  {platform}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Project filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex h-9 items-center gap-1.5 rounded-[6px] border border-border px-3 text-sm transition-colors hover:bg-background-tertiary",
                filters.projectId ? "text-foreground" : "text-foreground-secondary"
              )}>
                {filters.projectId
                  ? projects.find((p) => (p.id as string) === filters.projectId)?.name ?? "Project"
                  : "Project"
                }
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, projectId: undefined })}>
                All Projects
              </DropdownMenuItem>
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onFiltersChange({ ...filters, projectId: project.id as string })}
                >
                  <span
                    className="mr-2 h-2 w-2 rounded-full"
                    style={{ backgroundColor: project.color ?? '#6b7280' }}
                  />
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <button
              onClick={() => onFiltersChange({})}
              className="flex h-9 items-center gap-1.5 rounded-[6px] px-3 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
            >
              <Filter className="h-3.5 w-3.5" />
              Clear
            </button>
          )}

          {/* Create button */}
          <button
            onClick={onCreateContent}
            disabled={isCreating}
            className="flex h-9 items-center gap-1.5 rounded-[6px] bg-accent-blue px-4 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Content
          </button>
        </div>
      </div>

      {/* Pipeline columns */}
      <div className="flex-1 overflow-y-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={kanbanCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3">
            {STAGES.map((stage) => (
              <DroppableColumn
                key={stage}
                stage={stage}
                stageContents={sortedContentsByStage(stage)}
                onStageChange={onStageChange}
                onSelectContent={onSelectContent}
                onDeleteContent={onDeleteContent}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeContent ? <ContentCardOverlay content={activeContent} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
