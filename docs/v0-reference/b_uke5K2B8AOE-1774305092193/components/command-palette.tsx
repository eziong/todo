"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Plus,
  Inbox,
  LayoutDashboard,
  Circle,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Hash,
  FileText,
} from "lucide-react"

interface CommandItem {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  tag?: { label: string; color: string }
  dot?: string
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

  const sections: CommandSection[] = [
    {
      title: "Recent",
      items: [
        {
          id: "recent-1",
          label: "Buy groceries",
          icon: <Circle className="h-4 w-4" />,
          tag: { label: "Todo", color: "blue" },
        },
        {
          id: "recent-2",
          label: "Command Center",
          icon: <Hash className="h-4 w-4" />,
          tag: { label: "Project", color: "purple" },
        },
      ],
    },
    {
      title: "Actions",
      items: [
        {
          id: "action-1",
          label: "New Task",
          icon: <Plus className="h-4 w-4" />,
          shortcut: "⌘N",
        },
        {
          id: "action-2",
          label: "New Project",
          icon: <Plus className="h-4 w-4" />,
          shortcut: "⌘⇧N",
        },
        {
          id: "action-3",
          label: "Go to Inbox",
          icon: <Inbox className="h-4 w-4" />,
          shortcut: "⌘2",
        },
        {
          id: "action-4",
          label: "Go to Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
          shortcut: "⌘1",
        },
      ],
    },
    {
      title: "Quick Filters",
      items: [
        {
          id: "filter-1",
          label: "High Priority Tasks",
          icon: <FileText className="h-4 w-4" />,
          dot: "red",
        },
        {
          id: "filter-2",
          label: "Due Today",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          id: "filter-3",
          label: "Completed Today",
          icon: <CheckCircle2 className="h-4 w-4" />,
        },
      ],
    },
  ]

  // Flatten items for keyboard navigation
  const allItems = sections.flatMap((section) => section.items)

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setQuery("")
    setSelectedIndex(0)
  }, [onOpenChange])

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
        setSelectedIndex((prev) => (prev + 1) % allItems.length)
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length)
      }

      // Select with Enter
      if (e.key === "Enter") {
        e.preventDefault()
        handleClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange, allItems.length, handleClose])

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
            {sections.map((section) => (
              <div key={section.title} className="mb-2 last:mb-0">
                <div className="px-2 py-1.5 text-xs font-medium text-foreground-secondary">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    currentIndex++
                    const isSelected = currentIndex === selectedIndex

                    return (
                      <button
                        key={item.id}
                        className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                          isSelected
                            ? "bg-accent-blue/10 text-foreground"
                            : "text-foreground hover:bg-background-tertiary"
                        }`}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        onClick={handleClose}
                      >
                        <span className={isSelected ? "text-accent-blue" : "text-foreground-secondary"}>
                          {item.icon}
                        </span>
                        <span className="flex-1 text-sm">{item.label}</span>

                        {item.dot && (
                          <span className={`h-2 w-2 rounded-full ${getDotColorClasses(item.dot)}`} />
                        )}

                        {item.tag && (
                          <span
                            className={`rounded-[4px] px-1.5 py-0.5 text-xs font-medium ${getTagColorClasses(
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
            ))}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-foreground-secondary">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-[#222226] px-1 py-0.5 font-mono">↑</kbd>
                <kbd className="rounded bg-[#222226] px-1 py-0.5 font-mono">↓</kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-[#222226] px-1 py-0.5 font-mono">↵</kbd>
                <span className="ml-1">Select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-[#222226] px-1 py-0.5 font-mono">⌘K</kbd>
              <span className="ml-1">Toggle</span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
