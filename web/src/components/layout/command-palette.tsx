"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  Inbox,
  LayoutDashboard,
  Circle,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Hash,
  CheckSquare,
  Settings,
} from "lucide-react"
import { useTodos } from "@/hooks/useTodos"
import { useProjects } from "@/hooks/useProjects"
import { useAppStore } from "@/stores/app-store"

interface CommandItem {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  tag?: { label: string; color: string }
  dot?: string
  action: () => void
}

interface CommandSection {
  title: string
  items: CommandItem[]
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const { data: todos } = useTodos()
  const { data: projects } = useProjects(false)

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setQuery("")
    setSelectedIndex(0)
  }, [onOpenChange])

  const navigateTo = useCallback((path: string) => {
    handleClose()
    router.push(path)
  }, [handleClose, router])

  const sections = useMemo<CommandSection[]>(() => {
    const recentTodos = (todos ?? [])
      .filter((t) => t.status !== "completed")
      .slice(0, 5)
      .map((t) => ({
        id: `todo-${t.id}`,
        label: t.title,
        icon: <Circle className="h-4 w-4" />,
        tag: { label: "Task", color: "blue" },
        action: () => navigateTo("/tasks"),
      }))

    const projectItems = (projects ?? []).map((p) => ({
      id: `project-${p.id}`,
      label: p.name,
      icon: <Hash className="h-4 w-4" />,
      tag: { label: "Project", color: p.color ?? "gray" },
      action: () => navigateTo(`/projects/${p.id}`),
    }))

    const result: CommandSection[] = []

    if (recentTodos.length > 0 || projectItems.length > 0) {
      const dynamicItems = [...recentTodos, ...projectItems]
      if (dynamicItems.length > 0) {
        result.push({ title: "Recent", items: dynamicItems })
      }
    }

    result.push({
      title: "Actions",
      items: [
        {
          id: "action-new-task",
          label: "New Task",
          icon: <Plus className="h-4 w-4" />,
          shortcut: "\u2318N",
          action: () => {
            handleClose()
            useAppStore.getState().requestQuickAddFocus()
            router.push("/tasks")
          },
        },
        {
          id: "action-new-project",
          label: "New Project",
          icon: <Plus className="h-4 w-4" />,
          shortcut: "\u2318\u21E7N",
          action: () => navigateTo("/projects"),
        },
        {
          id: "action-go-tasks",
          label: "Go to Tasks",
          icon: <CheckSquare className="h-4 w-4" />,
          action: () => navigateTo("/tasks"),
        },
        {
          id: "action-go-inbox",
          label: "Go to Inbox",
          icon: <Inbox className="h-4 w-4" />,
          action: () => navigateTo("/inbox"),
        },
        {
          id: "action-go-dashboard",
          label: "Go to Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
          action: () => navigateTo("/"),
        },
        {
          id: "action-go-settings",
          label: "Go to Settings",
          icon: <Settings className="h-4 w-4" />,
          action: () => navigateTo("/settings"),
        },
      ],
    })

    result.push({
      title: "Quick Filters",
      items: [
        {
          id: "filter-high-priority",
          label: "High Priority Tasks",
          icon: <AlertTriangle className="h-4 w-4" />,
          dot: "red",
          action: () => navigateTo("/tasks?priority=high"),
        },
        {
          id: "filter-due-today",
          label: "Due Today",
          icon: <Calendar className="h-4 w-4" />,
          action: () => navigateTo("/tasks?due=today"),
        },
        {
          id: "filter-overdue",
          label: "Overdue Tasks",
          icon: <AlertTriangle className="h-4 w-4" />,
          dot: "orange",
          action: () => navigateTo("/tasks?due=overdue"),
        },
      ],
    })

    return result
  }, [todos, projects, navigateTo, handleClose, router])

  // Filter sections by query
  const filteredSections = useMemo(() => {
    if (!query.trim()) return sections

    const q = query.toLowerCase()
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.label.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [sections, query])

  // Flatten items for keyboard navigation
  const allItems = useMemo(
    () => filteredSections.flatMap((section) => section.items),
    [filteredSections]
  )

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd+K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }

      if (!open) return

      // Close with Escape
      if (e.key === "Escape") {
        e.preventDefault()
        handleClose()
      }

      // Navigate with arrow keys
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          allItems.length > 0 ? (prev + 1) % allItems.length : 0
        )
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0
        )
      }

      // Select with Enter
      if (e.key === "Enter" && !e.isComposing) {
        e.preventDefault()
        const selectedItem = allItems[selectedIndex]
        if (selectedItem?.action) {
          selectedItem.action()
        } else {
          handleClose()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange, allItems, selectedIndex, handleClose])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  // Track current item index for keyboard navigation
  let currentIndex = -1

  const getTagColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-accent-blue/20 text-accent-blue",
      purple: "bg-accent-purple/20 text-accent-purple",
      green: "bg-accent-green/20 text-accent-green",
      yellow: "bg-accent-yellow/20 text-accent-yellow",
      red: "bg-accent-red/20 text-accent-red",
      orange: "bg-accent-orange/20 text-accent-orange",
      pink: "bg-accent-pink/20 text-accent-pink",
      gray: "bg-accent-gray/20 text-accent-gray",
    }
    return colors[color] || colors.gray
  }

  const getDotColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      red: "bg-accent-red",
      orange: "bg-accent-orange",
      yellow: "bg-accent-yellow",
      green: "bg-accent-green",
      blue: "bg-accent-blue",
      purple: "bg-accent-purple",
      pink: "bg-accent-pink",
      gray: "bg-accent-gray",
    }
    return colors[color] || colors.gray
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={handleClose}
      />

      {/* Command Panel */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        <div
          className="w-full max-w-[640px] overflow-hidden rounded-lg border border-border bg-background-secondary shadow-2xl animate-in fade-in-0 zoom-in-[0.98] duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-5 w-5 shrink-0 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 flex-1 bg-transparent text-base text-foreground placeholder:text-foreground-secondary focus:outline-none"
              autoFocus
            />
            <kbd className="hidden shrink-0 rounded bg-[#222226] px-2 py-1 font-mono text-xs text-foreground-secondary sm:inline-block">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {filteredSections.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-foreground-secondary">No results found</p>
              </div>
            ) : (
              filteredSections.map((section) => (
                <div key={section.title} className="mb-2 last:mb-0">
                  <div className="px-2 py-1.5 text-xs font-medium text-foreground-secondary">
                    {section.title}
                  </div>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      currentIndex++
                      const isSelected = currentIndex === selectedIndex
                      const itemIndex = currentIndex

                      return (
                        <button
                          key={item.id}
                          className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                            isSelected
                              ? "bg-accent-blue/10 text-foreground"
                              : "text-foreground hover:bg-background-tertiary"
                          }`}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          onClick={() => item.action()}
                        >
                          <span className={isSelected ? "text-accent-blue" : "text-foreground-secondary"}>
                            {item.icon}
                          </span>
                          <span className="flex-1 truncate text-sm">{item.label}</span>

                          {item.dot && (
                            <span className={`h-2 w-2 rounded-full ${getDotColorClasses(item.dot)}`} />
                          )}

                          {item.tag && (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${getTagColorClasses(
                                item.tag.color
                              )}`}
                            >
                              {item.tag.label}
                            </span>
                          )}

                          {item.shortcut && (
                            <kbd className="rounded bg-[#222226] px-1.5 py-0.5 font-mono text-xs text-foreground-secondary">
                              {item.shortcut}
                            </kbd>
                          )}

                          {isSelected && (
                            <ArrowRight className="h-4 w-4 text-accent-blue" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-foreground-secondary">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-[#222226] px-1 py-0.5 font-mono">{"\u2191"}</kbd>
                <kbd className="rounded bg-[#222226] px-1 py-0.5 font-mono">{"\u2193"}</kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-[#222226] px-1 py-0.5 font-mono">{"\u21B5"}</kbd>
                <span className="ml-1">Select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-[#222226] px-1 py-0.5 font-mono">{"\u2318K"}</kbd>
              <span className="ml-1">Toggle</span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
