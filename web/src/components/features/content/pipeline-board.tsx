"use client"

import { Plus, Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ContentCard, STAGES, STAGE_LABELS } from "./content-card"
import type { ContentStage, ContentType, ContentPlatform, ContentFilters, ContentWithDetails } from "@/types/domain"
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

interface PipelineBoardProps {
  contents: ContentWithDetails[]
  projects: ProjectWithStats[]
  filters: ContentFilters
  onFiltersChange: (filters: ContentFilters) => void
  onStageChange: (id: string, stage: ContentStage) => void
  onCreateContent: () => void
  onDeleteContent: (id: string) => void
  onSelectContent: (id: string) => void
  isCreating: boolean
}

export function PipelineBoard({
  contents,
  projects,
  filters,
  onFiltersChange,
  onStageChange,
  onCreateContent,
  onDeleteContent,
  onSelectContent,
  isCreating,
}: PipelineBoardProps) {
  const contentsByStage = (stage: ContentStage) =>
    contents.filter((c) => c.stage === stage)

  const hasActiveFilters = Boolean(filters.type || filters.platform || filters.projectId)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
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
        <div className="flex gap-3">
          {STAGES.map((stage) => {
            const stageContents = contentsByStage(stage)
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
                <div className="flex-1 space-y-2 px-2 pb-2">
                  {stageContents.length === 0 ? (
                    <div className="flex items-center justify-center rounded-[6px] border border-dashed border-border py-6">
                      <span className="text-[11px] text-foreground-secondary/50">Empty</span>
                    </div>
                  ) : (
                    stageContents.map((content) => (
                      <div key={content.id} className="relative">
                        <ContentCard
                          content={content}
                          onStageChange={onStageChange}
                          onSelect={onSelectContent}
                          onDelete={onDeleteContent}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
