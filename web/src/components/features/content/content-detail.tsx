"use client"

import { useState } from "react"
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
  ContentStage,
  ContentType,
  ContentPlatform,
  UpdateContentInput,
  CreateContentChecklistInput,
  UpdateContentChecklistInput,
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
  onCreateChecklist,
  onUpdateChecklist,
  onDeleteChecklist,
  onBack,
}: ContentDetailProps) {
  const [title, setTitle] = useState(content.title)
  const [description, setDescription] = useState(content.description ?? "")
  const [newChecklistLabel, setNewChecklistLabel] = useState("")
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const scheduleAutoSave = (updates: UpdateContentInput) => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    const timer = setTimeout(() => {
      onUpdate(content.id, updates)
    }, 1000)
    setAutoSaveTimer(timer)
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    scheduleAutoSave({ title: value })
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    scheduleAutoSave({ description: value })
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
      label: newChecklistLabel.trim(),
      position: checklists.length,
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
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Stage selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-[6px] border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary">
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
              <button className={cn("rounded-[4px] px-2 py-1 text-xs font-medium", TYPE_COLORS[content.type])}>
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
              <button className={cn("rounded-[4px] px-2 py-1 text-xs font-medium", PLATFORM_COLORS[content.platform])}>
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
          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-accent-red"
          aria-label="Delete content"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Content title..."
            className="w-full border-none bg-transparent text-2xl font-bold text-foreground placeholder:text-foreground-secondary/50 focus:outline-none"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add a description..."
            className="min-h-[120px] w-full resize-none border-none bg-transparent text-sm text-foreground placeholder:text-foreground-secondary/50 focus:outline-none leading-relaxed"
          />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4 rounded-[8px] border border-border bg-background-secondary p-4">
            {/* Project */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
                <Layout className="h-3 w-3" />
                Project
              </label>
              <select
                value={(content.projectId as string) ?? ""}
                onChange={(e) => handleProjectChange(e.target.value || null)}
                className="h-8 w-full rounded-[6px] border border-border bg-background px-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
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
                className="h-8 w-full rounded-[6px] border border-border bg-background px-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
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
                className="h-8 w-full rounded-[6px] border border-border bg-background px-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
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
                className="h-8 w-full rounded-[6px] border border-border bg-background px-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
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
                  className="flex items-center gap-1 rounded-[4px] bg-background-tertiary px-2 py-0.5 text-xs text-foreground-secondary"
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

          {/* Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Checklist</label>
              {checklists.length > 0 && (
                <span className="text-xs text-foreground-secondary">
                  {checklists.filter((c) => c.checked).length}/{checklists.length}
                </span>
              )}
            </div>

            <div className="space-y-1">
              {checklists.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 rounded-[6px] px-2 py-1.5 hover:bg-background-secondary"
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
                    className="flex h-5 w-5 items-center justify-center rounded-[4px] text-foreground-secondary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background-tertiary hover:text-accent-red"
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
        </div>
      </div>
    </div>
  )
}
