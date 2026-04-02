"use client"

import { useState, useRef, useEffect } from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeft,
  Trash2,
  Plus,
  X,
  Calendar,
  FileText,
  Layout,
  Check,
  Circle,
  CheckCircle2,
  Search,
  Link2,
  GripVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useBeforeUnload } from "@/hooks/useBeforeUnload"
import { useSaveStatus } from "@/hooks/useSaveStatus"
import { useTodos } from "@/hooks/useTodos"
import { SaveStatus } from "@/components/ui/save-status"
import { STAGES, STAGE_LABELS, TYPE_COLORS, PLATFORM_COLORS } from "./content-card"
import type { ContentId, TodoId } from "@/types/branded"
import type {
  ContentWithDetails,
  ContentStageData,
  ContentStage,
  ContentType,
  ContentPlatform,
  UpdateContentInput,
  CreateTodoInput,
  UpdateTodoInput,
  MoveTodoInput,
  UpsertStageDataInput,
  ProjectWithStats,
  NoteWithFolder,
  DescriptionTemplate,
  TodoWithProject,
} from "@/types/domain"

interface ContentDetailProps {
  content: ContentWithDetails
  todos: TodoWithProject[]
  projects: ProjectWithStats[]
  notes: NoteWithFolder[]
  templates: DescriptionTemplate[]
  onUpdate: (id: ContentId, input: UpdateContentInput) => void
  onDelete: (id: ContentId) => void
  onUpsertStageData: (contentId: ContentId, stage: ContentStage, input: UpsertStageDataInput) => void
  onCreateTodo: (input: CreateTodoInput) => void
  onUpdateTodo: (id: TodoId, input: UpdateTodoInput) => void
  onMoveTodo: (input: MoveTodoInput) => void
  onUnlinkTodo: (id: TodoId) => void
  onLinkTodo: (id: TodoId, stage: ContentStage) => void
  onBack: () => void
}

function SortableTodoItem({
  todo,
  onToggle,
  onUnlink,
}: {
  todo: TodoWithProject
  onToggle: (todo: TodoWithProject) => void
  onUnlink: (id: TodoId) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id as string })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-background-secondary",
        isDragging && "opacity-50"
      )}
    >
      <button
        className="flex h-4 w-4 shrink-0 cursor-grab items-center justify-center text-foreground-secondary/30 hover:text-foreground-secondary active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        onClick={() => onToggle(todo)}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
          todo.status === "completed"
            ? "border-accent-blue bg-accent-blue text-white"
            : "border-foreground-secondary/30 hover:border-foreground-secondary"
        )}
      >
        {todo.status === "completed" && <Check className="h-3 w-3" />}
      </button>
      <span className={cn(
        "flex-1 text-sm",
        todo.status === "completed" ? "text-foreground-secondary line-through" : "text-foreground"
      )}>
        {todo.title}
      </span>
      {todo.project && (
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px]"
          style={{
            backgroundColor: todo.project.color ? `${todo.project.color}20` : undefined,
            color: todo.project.color ?? undefined,
          }}
        >
          {todo.project.name}
        </span>
      )}
      <button
        onClick={() => onUnlink(todo.id)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-foreground-secondary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background-tertiary hover:text-accent-red"
        title="Unlink from content"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function ContentDetail({
  content,
  todos,
  projects,
  notes,
  templates,
  onUpdate,
  onDelete,
  onUpsertStageData,
  onCreateTodo,
  onUpdateTodo,
  onMoveTodo,
  onUnlinkTodo,
  onLinkTodo,
  onBack,
}: ContentDetailProps) {
  const [title, setTitle] = useState(content.title)
  const [activeTab, setActiveTab] = useState<ContentStage>(content.stage)
  const [newTodoTitle, setNewTodoTitle] = useState("")
  const [linkSearchQuery, setLinkSearchQuery] = useState("")
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false)
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTitleRef = useRef<string | null>(null)
  const pendingDescRef = useRef<{ stage: ContentStage; value: string } | null>(null)

  const { status: saveStatus, markSaving, markSaved } = useSaveStatus()

  // Search todos for linking (exclude already linked ones)
  const { data: searchResults } = useTodos(
    linkSearchQuery.trim().length > 0 ? { search: linkSearchQuery.trim() } : undefined,
  )
  const linkedTodoIds = new Set(todos.map((t) => t.id as string))
  const filteredSearchResults = (searchResults ?? []).filter(
    (t) => !linkedTodoIds.has(t.id as string),
  )

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

  // Track dirty state for beforeunload protection
  const isDirty = title !== content.title || stageDescription !== (activeStageData?.description ?? "")
  useBeforeUnload(isDirty)

  // Flush pending auto-saves on unmount
  useEffect(() => {
    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
      if (descTimerRef.current) clearTimeout(descTimerRef.current)
      if (pendingTitleRef.current !== null) {
        onUpdate(content.id, { title: pendingTitleRef.current })
      }
      if (pendingDescRef.current) {
        onUpsertStageData(content.id, pendingDescRef.current.stage, {
          description: pendingDescRef.current.value || null,
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // DnD sensors for todo reordering
  const todoDndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )
  const [activeTodoId, setActiveTodoId] = useState<string | null>(null)

  // Filter and sort todos by active tab stage
  const stageTodos = todos
    .filter((t) => t.contentStage === activeTab)
    .sort((a, b) => {
      if (a.position !== null && b.position !== null) return a.position < b.position ? -1 : a.position > b.position ? 1 : 0
      if (a.position !== null) return -1
      if (b.position !== null) return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  const completedCount = stageTodos.filter((t) => t.status === "completed").length
  const activeTodo = activeTodoId ? stageTodos.find((t) => (t.id as string) === activeTodoId) ?? null : null

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
    pendingTitleRef.current = value
    titleTimerRef.current = setTimeout(() => {
      pendingTitleRef.current = null
      markSaving()
      onUpdate(content.id, { title: value })
      markSaved()
    }, 1000)
  }

  const handleStageDescriptionChange = (value: string) => {
    setStageDescription(value)
    if (descTimerRef.current) clearTimeout(descTimerRef.current)
    pendingDescRef.current = { stage: activeTab, value }
    descTimerRef.current = setTimeout(() => {
      pendingDescRef.current = null
      markSaving()
      onUpsertStageData(content.id, activeTab, { description: value || null })
      markSaved()
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

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) return
    onCreateTodo({
      title: newTodoTitle.trim(),
      contentId: content.id as string,
      contentStage: activeTab,
    })
    setNewTodoTitle("")
  }

  const handleToggleTodo = (todo: TodoWithProject) => {
    onUpdateTodo(todo.id, {
      status: todo.status === "completed" ? "todo" : "completed",
    })
  }

  const handleLinkExistingTodo = (todoId: TodoId) => {
    onLinkTodo(todoId, activeTab)
    setLinkSearchQuery("")
    setIsLinkPopoverOpen(false)
  }

  const handleTodoDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTodoId(null)
    if (!over || active.id === over.id) return

    const oldIndex = stageTodos.findIndex((t) => (t.id as string) === active.id)
    const newIndex = stageTodos.findIndex((t) => (t.id as string) === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(stageTodos, oldIndex, newIndex)
    const movedIndex = reordered.findIndex((t) => (t.id as string) === active.id)
    const afterId = movedIndex > 0 ? (reordered[movedIndex - 1].id as string) : undefined
    const beforeId = movedIndex < reordered.length - 1 ? (reordered[movedIndex + 1].id as string) : undefined

    onMoveTodo({ id: active.id as string, afterId, beforeId })
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

          <SaveStatus status={saveStatus} />
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

          {/* Stage Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                {STAGE_LABELS[activeTab]} Tasks
              </label>
              <div className="flex items-center gap-2">
                {stageTodos.length > 0 && (
                  <span className="text-xs text-foreground-secondary">
                    {completedCount}/{stageTodos.length}
                  </span>
                )}

                {/* Link existing todo */}
                <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex h-6 items-center gap-1 rounded-md px-2 text-xs text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground">
                      <Link2 className="h-3 w-3" />
                      Link
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2" align="end">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-md border border-border bg-background-secondary px-2">
                        <Search className="h-3.5 w-3.5 text-foreground-secondary" />
                        <input
                          type="text"
                          value={linkSearchQuery}
                          onChange={(e) => setLinkSearchQuery(e.target.value)}
                          placeholder="Search todos..."
                          className="h-8 flex-1 border-none bg-transparent text-sm text-foreground placeholder:text-foreground-secondary/50 focus:outline-none"
                          autoFocus
                        />
                      </div>
                      {linkSearchQuery.trim().length > 0 && (
                        <div className="max-h-48 overflow-auto">
                          {filteredSearchResults.length === 0 ? (
                            <p className="px-2 py-3 text-center text-xs text-foreground-secondary">
                              No matching todos
                            </p>
                          ) : (
                            filteredSearchResults.slice(0, 10).map((todo) => (
                              <button
                                key={todo.id}
                                onClick={() => handleLinkExistingTodo(todo.id)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-background-tertiary"
                              >
                                <span className="truncate">{todo.title}</span>
                                {todo.project && (
                                  <span
                                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px]"
                                    style={{
                                      backgroundColor: todo.project.color ? `${todo.project.color}20` : undefined,
                                      color: todo.project.color ?? undefined,
                                    }}
                                  >
                                    {todo.project.name}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DndContext
              sensors={todoDndSensors}
              collisionDetection={closestCenter}
              onDragStart={(e: DragStartEvent) => setActiveTodoId(e.active.id as string)}
              onDragEnd={handleTodoDragEnd}
            >
              <SortableContext
                items={stageTodos.map((t) => t.id as string)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {stageTodos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={handleToggleTodo}
                      onUnlink={onUnlinkTodo}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay dropAnimation={null}>
                {activeTodo ? (
                  <div className="flex items-center gap-2 rounded-lg bg-background-secondary px-2 py-1.5 shadow-lg">
                    <GripVertical className="h-3 w-3 text-foreground-secondary/30" />
                    <span className={cn(
                      "flex-1 text-sm",
                      activeTodo.status === "completed" ? "text-foreground-secondary line-through" : "text-foreground"
                    )}>
                      {activeTodo.title}
                    </span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* Add new todo inline */}
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-foreground-secondary" />
              <input
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleAddTodo()
                }}
                placeholder="Add task..."
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
