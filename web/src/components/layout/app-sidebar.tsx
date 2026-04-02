"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  Bell,
  FileText,
  Link2,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useProjects } from "@/hooks/useProjects"
import { useUnreadCount } from "@/hooks/useNotifications"
import { useAuth } from "@/components/providers/auth-provider"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: "unread" | "inbox"
}

// --- Zone 1: Global ---
const globalItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Inbox, label: "Inbox", href: "/inbox", badge: "inbox" },
  { icon: CheckSquare, label: "My Tasks", href: "/tasks" },
  { icon: Bell, label: "Notifications", href: "/notifications", badge: "unread" },
]

// --- Zone 3: Library ---
const libraryItems: NavItem[] = [
  { icon: FileText, label: "Notes", href: "/notes" },
  { icon: Link2, label: "Links", href: "/links" },
]

function getProjectDotColor(color: string | null): string {
  switch (color) {
    case "blue": return "bg-accent-blue"
    case "purple": return "bg-accent-purple"
    case "green": return "bg-accent-green"
    case "orange": return "bg-accent-orange"
    case "red": return "bg-accent-red"
    case "pink": return "bg-accent-pink"
    case "yellow": return "bg-accent-yellow"
    default: return "bg-accent-gray"
  }
}

interface AppSidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export function AppSidebar({ collapsed, onCollapsedChange }: AppSidebarProps) {
  const pathname = usePathname()
  const [projectsExpanded, setProjectsExpanded] = useState(true)
  const [libraryExpanded, setLibraryExpanded] = useState(true)
  const [quickTaskValue, setQuickTaskValue] = useState("")
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { data: projects } = useProjects(false)
  const { data: unreadCount } = useUnreadCount()
  const { signOut } = useAuth()

  useEffect(() => { setMounted(true) }, [])

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const getBadgeCount = (item: NavItem): number | undefined => {
    if (item.badge === "unread" || item.badge === "inbox") {
      return unreadCount ?? undefined
    }
    return undefined
  }

  const handleQuickTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && quickTaskValue.trim()) {
      setQuickTaskValue("")
    }
  }

  const renderNavItem = (item: NavItem) => {
    const badgeCount = getBadgeCount(item)

    return (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
          isActive(item.href)
            ? "bg-background-tertiary text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:-translate-y-1/2 before:w-[3px] before:rounded-full before:bg-accent-blue"
            : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground",
          collapsed && "justify-center px-0"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {badgeCount !== undefined && badgeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-blue px-1.5 text-xs font-medium text-white">
                {badgeCount}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "group/sidebar flex h-screen flex-col bg-background-secondary transition-all duration-200",
        "dark:border-r dark:border-border/50",
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
            "flex h-7 w-7 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground",
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
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2">
        {/* Global Zone */}
        <div className="space-y-1">
          {globalItems.map(renderNavItem)}
        </div>

        {/* Projects Zone */}
        {!collapsed ? (
          <div className="mt-6">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-[11px] font-mono uppercase tracking-[0.08em] text-foreground-secondary transition-colors hover:text-foreground"
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
                {(projects ?? []).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
                      pathname === `/projects/${project.id}`
                        ? "bg-background-tertiary text-foreground"
                        : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", getProjectDotColor(project.color))} />
                    <span className="truncate">{project.name}</span>
                  </Link>
                ))}
                <Link
                  href="/projects"
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Project</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 flex justify-center">
            <Link
              href="/projects"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                isActive("/projects")
                  ? "bg-background-tertiary text-foreground"
                  : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
              )}
              aria-label="Projects"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Library Zone */}
        {!collapsed ? (
          <div className="mt-6">
            <button
              onClick={() => setLibraryExpanded(!libraryExpanded)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-[11px] font-mono uppercase tracking-[0.08em] text-foreground-secondary transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  !libraryExpanded && "-rotate-90"
                )}
              />
              Library
            </button>
            {libraryExpanded && (
              <div className="mt-1 space-y-1">
                {libraryItems.map(renderNavItem)}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-1">
            {libraryItems.map(renderNavItem)}
          </div>
        )}
      </nav>

      {/* Bottom actions */}
      <div className={cn(
        "flex items-center gap-1 border-t border-border p-2",
        collapsed ? "flex-col" : "flex-row"
      )}>
        <Link
          href="/settings"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            isActive("/settings")
              ? "bg-background-tertiary text-foreground"
              : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
          )}
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          aria-label="Toggle theme"
        >
          {!mounted || resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={signOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
