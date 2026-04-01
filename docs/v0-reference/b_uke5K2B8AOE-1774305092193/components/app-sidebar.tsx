"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  Inbox,
  CalendarCheck,
  CheckSquare,
  Hammer,
  Settings,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ViewType } from "@/app/page"

interface NavItem {
  icon: React.ElementType
  label: string
  view: ViewType
  count?: number
}

interface Project {
  name: string
  color: string
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" },
  { icon: Inbox, label: "Inbox", view: "inbox", count: 5 },
  { icon: CalendarCheck, label: "Today", view: "today", count: 3 },
  { icon: CheckSquare, label: "All Tasks", view: "tasks" },
  { icon: Hammer, label: "Builds", view: "builds" },
]

const projects: Project[] = [
  { name: "Command Center", color: "bg-accent-blue" },
  { name: "YouTube Channel", color: "bg-accent-purple" },
  { name: "Server API", color: "bg-accent-green" },
]

interface AppSidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

export function AppSidebar({ collapsed, onCollapsedChange, activeView, onViewChange }: AppSidebarProps) {
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  const [quickTaskValue, setQuickTaskValue] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(true)

  const handleQuickTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && quickTaskValue.trim()) {
      setQuickTaskValue("")
    }
  }

  return (
    <aside
      className={cn(
        "group/sidebar flex h-screen flex-col border-r border-border bg-background-secondary transition-all duration-200",
        collapsed ? "w-12" : "w-60"
      )}
    >
      {/* Logo and collapse button */}
      <div className="flex h-14 items-center justify-between px-3">
        {!collapsed && (
          <span className="text-base font-semibold text-foreground">Command</span>
        )}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[6px] text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground",
            collapsed && "mx-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4 opacity-0 transition-opacity group-hover/sidebar:opacity-100" />
          )}
        </button>
      </div>

      {/* Quick capture input */}
      {!collapsed && (
        <div className="px-3 pb-4">
          <input
            type="text"
            value={quickTaskValue}
            onChange={(e) => setQuickTaskValue(e.target.value)}
            onKeyDown={handleQuickTask}
            placeholder="New task... (Cmd+N)"
            className="h-9 w-full rounded-[6px] border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onViewChange(item.view)}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-[6px] px-2 py-2 text-sm transition-colors",
              activeView === item.view
                ? "bg-background-tertiary text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:-translate-y-1/2 before:w-0.5 before:rounded-r before:bg-accent-blue"
                : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-accent-blue px-1.5 text-xs font-medium text-white">
                    {item.count}
                  </span>
                )}
              </>
            )}
          </button>
        ))}

        {/* Projects section */}
        {!collapsed && (
          <div className="pt-4">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-foreground-secondary transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  !projectsExpanded && "-rotate-90"
                )}
              />
              Projects
            </button>
            {projectsExpanded && (
              <div className="mt-1 space-y-1">
                {projects.map((project) => (
                  <button
                    key={project.name}
                    className="flex w-full items-center gap-3 rounded-[6px] px-2 py-2 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                  >
                    <span className={cn("h-2 w-2 rounded-full", project.color)} />
                    <span>{project.name}</span>
                  </button>
                ))}
                <button className="flex w-full items-center gap-3 rounded-[6px] px-2 py-2 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground">
                  <Plus className="h-4 w-4" />
                  <span>New Project</span>
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom actions */}
      <div className={cn(
        "flex items-center gap-1 border-t border-border p-2",
        collapsed ? "flex-col" : "flex-row"
      )}>
        <button
          onClick={() => onViewChange("settings")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors",
            activeView === "settings" 
              ? "bg-background-tertiary text-foreground" 
              : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
          )}
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
