"use client"

import { useState, useRef } from "react"
import {
  ArrowLeft,
  Trash2,
  Plus,
  X,
  Calendar,
  FileText,
  Layout,
  Check,
  Square,
  Circle,
  CheckCircle2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { STAGES, STAGE_LABELS, TYPE_COLORS, PLATFORM_COLORS } from "./content-card"
import type { ContentId, ContentChecklistId } from "@/types/branded"
import type {
  ContentWithDetails,
  ContentChecklist,
  ContentStageData,
  ContentStage,
  ContentType,
  ContentPlatform,
  UpdateContentInput,
  CreateContentChecklistInput,
  UpdateContentChecklistInput,
  UpsertStageDataInput,
  ProjectWithStats,
  NoteWithFolder,
  DescriptionTemplate,
} from "@/types/domain"

interface ContentDetailProps {
  content: ContentWithDetails
  checklists: ContentChecklist[]
  projects: ProjectWithStats[]
  notes: NoteWithFolder[]
  templates: DescriptionTemplate[]
  onUpdate: (id: ContentId, input: UpdateContentInput) => void
  onDelete: (id: ContentId) => void
  onUpsertStageData: (contentId: ContentId, stage: ContentStage, input: UpsertStageDataInput) => void
  onCreateChecklist: (input: CreateContentChecklistInput) => void
  onUpdateChecklist: (id: ContentChecklistId, input: UpdateContentChecklistInput) => void
  onDeleteChecklist: (id: ContentChecklistId) => void
  onBack: () => void
}

export function ContentDetail({
  content,
  checklists,
  projects,
  notes,
  templates,
  onUpdate,
  onDelete,
  onUpsertStageData,
  onCreateChecklist,
  onUpdateChecklist,
  onDeleteChecklist,
  onBack,
}: ContentDetailProps) {
  const [title, setTitle] = useState(content.title)
  const [activeTab, setActiveTab] = useState<ContentStage>(content.stage)
  const [newChecklistLabel, setNewChecklistLabel] = useState("")
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get stage data for the active tab
  const activeStageData = content.stageData.find((sd) => sd.stage === activeTab)
  const [stageDescription, setStageDescription] = useState(activeStageData?.description ?? "")

  // Reset description when tab changes
  const prevTabRef = useRef(activeTab)
  if (prevTabRef.current !== activeTab) {
    prevTabRef.current = activeTab
    const sd = content.stageData.find((s) => s.stage === activeTab)
    setStageDescription(sd?.description ?? "")
  }

  // Filter checklists by active tab stage
  const stageChecklists = checklists.filter((c) => c.stage === activeTab)

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
    titleTimerRef.current = setTimeout(() => {
      onUpdate(content.id, { title: value })
    }, 1000)
  }

  const handleStageDescriptionChange = (value: string) => {
    setStageDescription(value)
    if (descTimerRef.current) clearTimeout(descTimerRef.current)
    descTimerRef.current = setTimeout(() => {
      onUpsertStageData(content.id, activeTab, { description: value || null })
    }, 1000)
  }

  const handleStageChange = (stage: ContentStage) => {
    onUpdate(content.id, { stage })
  }

  const handleTypeChange = (type: ContentType) => {
    onUpdate(content.id, { type })
  }

  const handlePlatformChange = (platform: ContentPlatform) => {
    onUpdate(content.id, { platform })
  }

  const handleProjectChange = (projectId: string | null) => {
    onUpdate(content.id, { projectId })
  }

  const handleNoteChange = (noteId: string | null) => {
    onUpdate(content.id, { noteId })
  }

  const handleTemplateChange = (templateId: string | null) => {
    onUpdate(content.id, { templateId })
  }

  const handleScheduledAtChange = (value: string) => {
    onUpdate(content.id, { scheduledAt: value || null })
  }

  const handleAddChecklist = () => {
    if (!newChecklistLabel.trim()) return
    onCreateChecklist({
      contentId: content.id as string,
      stage: activeTab,
      label: newChecklistLabel.trim(),
      position: stageChecklists.length,
    })
    setNewChecklistLabel("")
  }

  const handleDelete = () => {
    onDelete(content.id)
    onBack()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Stage selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary">
                {STAGE_LABELS[content.stage]}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {STAGES.map((stage) => (
                <DropdownMenuItem
                  key={stage}
                  onClick={() => handleStageChange(stage)}
                  className={cn(stage === content.stage && "bg-background-tertiary")}
                >
                  {STAGE_LABELS[stage]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Type badge */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("rounded-full px-2 py-1 text-xs font-medium", TYPE_COLORS[content.type])}>
                {content.type}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(['video', 'short', 'post', 'blog'] as ContentType[]).map((type) => (
                <DropdownMenuItem key={type} onClick={() => handleTypeChange(type)}>
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Platform badge */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("rounded-full px-2 py-1 text-xs font-medium", PLATFORM_COLORS[content.platform])}>
                {content.platform}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(['youtube', 'instagram', 'twitter', 'blog', 'other'] as ContentPlatform[]).map((platform) => (
                <DropdownMenuItem key={platform} onClick={() => handlePlatformChange(platform)}>
                  {platform}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          onClick={handleDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-accent-red"
          aria-label="Delete content"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Content title..."
            className="w-full border-none bg-transparent text-2xl font-bold text-foreground placeholder:text-foreground-secondary/50 focus:outline-none"
          />

          {/* Stage Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background-secondary p-1">
            {STAGES.map((stage) => {
              const isActive = stage === activeTab
              const isCurrent = stage === content.stage
              const stageData = content.stageData.find((sd) => sd.stage === stage)
              const hasCompleted = Boolean(stageData?.completedAt)

              return (
                <button
                  key={stage}
                  onClick={() => setActiveTab(stage)}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-foreground-secondary hover:text-foreground",
                  )}
                >
                  {hasCompleted ? (
                    <CheckCircle2 className="h-3 w-3 text-accent-green" />
                  ) : isCurrent ? (
                    <Circle className="h-3 w-3 fill-accent-blue text-accent-blue" />
                  ) : null}
                  {STAGE_LABELS[stage]}
                </button>
              )
            })}
          </div>

          {/* Stage Description */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground-secondary">
              {STAGE_LABELS[activeTab]} Notes
            </label>
            <textarea
              value={stageDescription}
              onChange={(e) => handleStageDescriptionChange(e.target.value)}
              placeholder={`Add notes for ${STAGE_LABELS[activeTab].toLowerCase()} stage...`}
              className="min-h-[120px] w-full resize-none rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-accent-blue focus:outline-none leading-relaxed"
            />
          </div>

          {/* Stage Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                {STAGE_LABELS[activeTab]} Checklist
              </label>
              {stageChecklists.length > 0 && (
                <span className="text-xs text-foreground-secondary">
                  {stageChecklists.filter((c) => c.checked).length}/{stageChecklists.length}
                </span>
              )}
            </div>

            <div className="space-y-1">
              {stageChecklists.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-background-secondary"
                >
                  <button
                    onClick={() => onUpdateChecklist(item.id, { checked: !item.checked })}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                      item.checked
                        ? "border-accent-blue bg-accent-blue text-white"
                        : "border-foreground-secondary/30 hover:border-foreground-secondary"
                    )}
                  >
                    {item.checked && <Check className="h-3 w-3" />}
                    {!item.checked && <Square className="h-3 w-3 opacity-0" />}
                  </button>
                  <span className={cn(
                    "flex-1 text-sm",
                    item.checked ? "text-foreground-secondary line-through" : "text-foreground"
                  )}>
                    {item.label}
                  </span>
                  <button
                    onClick={() => onDeleteChecklist(item.id)}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-foreground-secondary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background-tertiary hover:text-accent-red"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add checklist item */}
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-foreground-secondary" />
              <input
                type="text"
                value={newChecklistLabel}
                onChange={(e) => setNewChecklistLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleAddChecklist()
                }}
                placeholder="Add checklist item..."
                className="flex-1 border-none bg-transparent text-sm text-foreground placeholder:text-foreground-secondary/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-background-secondary p-4">
            {/* Project */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
                <Layout className="h-3 w-3" />
                Project
              </label>
              <select
                value={(content.projectId as string) ?? ""}
                onChange={(e) => handleProjectChange(e.target.value || null)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id as string}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Scheduled date */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
                <Calendar className="h-3 w-3" />
                Scheduled
              </label>
              <input
                type="datetime-local"
                value={content.scheduledAt ? content.scheduledAt.slice(0, 16) : ""}
                onChange={(e) => handleScheduledAtChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
              />
            </div>

            {/* Linked note */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
                <FileText className="h-3 w-3" />
                Note
              </label>
              <select
                value={(content.noteId as string) ?? ""}
                onChange={(e) => handleNoteChange(e.target.value || null)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
              >
                <option value="">No note</option>
                {notes.map((n) => (
                  <option key={n.id} value={n.id as string}>{n.title}</option>
                ))}
              </select>
            </div>

            {/* Template */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
                <FileText className="h-3 w-3" />
                Template
              </label>
              <select
                value={(content.templateId as string) ?? ""}
                onChange={(e) => handleTemplateChange(e.target.value || null)}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
              >
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id as string}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground-secondary">Tags</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {content.tags.map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-full bg-background-tertiary px-2 py-0.5 text-xs text-foreground-secondary"
                >
                  {tag}
                  <button
                    onClick={() => {
                      const newTags = content.tags.filter((_, idx) => idx !== i)
                      onUpdate(content.id, { tags: newTags })
                    }}
                    className="text-foreground-secondary/50 hover:text-foreground-secondary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag..."
                className="h-6 w-20 border-none bg-transparent text-xs text-foreground placeholder:text-foreground-secondary/50 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing && e.currentTarget.value.trim()) {
                    onUpdate(content.id, { tags: [...content.tags, e.currentTarget.value.trim()] })
                    e.currentTarget.value = ""
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
