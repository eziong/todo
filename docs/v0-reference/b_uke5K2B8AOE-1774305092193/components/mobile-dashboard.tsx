"use client"

import { useState } from "react"
import {
  Menu,
  Search,
  Plus,
  Circle,
  CheckCircle2,
  ArrowRight,
  LayoutDashboard,
  Inbox,
  CheckSquare,
  FolderOpen,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ViewType } from "@/app/page"

interface Task {
  id: string
  title: string
  completed: boolean
  priority: "high" | "medium" | "low"
}

const todaysTasks: Task[] = [
  { id: "1", title: "Design todo app wireframes", completed: false, priority: "high" },
  { id: "2", title: "Record YouTube video", completed: false, priority: "medium" },
  { id: "3", title: "Deploy server hotfix", completed: false, priority: "high" },
]

const projects = [
  { name: "Command", color: "bg-accent-blue", count: 3 },
  { name: "YouTube", color: "bg-accent-purple", count: 5 },
  { name: "Server", color: "bg-accent-green", count: 2 },
  { name: "Design", color: "bg-accent-orange", count: 4 },
  { name: "Personal", color: "bg-accent-pink", count: 1 },
]

type MobileTab = "dashboard" | "inbox" | "tasks" | "projects"

interface MobileDashboardProps {
  onOpenCommandPalette: () => void
  onViewChange: (view: ViewType) => void
}

export function MobileDashboard({ onOpenCommandPalette, onViewChange }: MobileDashboardProps) {
  const [tasks, setTasks] = useState(todaysTasks)
  const [activeTab, setActiveTab] = useState<MobileTab>("dashboard")
  const [menuOpen, setMenuOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high": return "bg-accent-red"
      case "medium": return "bg-accent-yellow"
      case "low": return "bg-accent-blue"
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <button
          onClick={() => setMenuOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-[6px] text-foreground-secondary transition-colors active:bg-background-tertiary"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-foreground">Command</span>
        <button
          onClick={onOpenCommandPalette}
          className="flex h-11 w-11 items-center justify-center rounded-[6px] text-foreground-secondary transition-colors active:bg-background-tertiary"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4">
          {/* Greeting */}
          <div className="mb-4">
            <h1 className="text-lg font-medium text-foreground">Good morning</h1>
            <p className="text-sm text-foreground-secondary">March 23, Monday</p>
          </div>

          {/* Quick Add Input */}
          <div className="mb-6">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background-secondary px-3 py-3">
              <Plus className="h-5 w-5 shrink-0 text-foreground-secondary" />
              <input
                type="text"
                placeholder="New task..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-secondary focus:outline-none"
              />
            </div>
          </div>

          {/* Today Section */}
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground-secondary">
              Today
            </h2>
            <div className="rounded-lg border border-border bg-background-secondary">
              {tasks.map((task, index) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-background-tertiary",
                    index !== tasks.length - 1 && "border-b border-border"
                  )}
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", getPriorityColor(task.priority))} />
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-green" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-foreground-secondary" />
                  )}
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      task.completed ? "text-foreground-secondary line-through" : "text-foreground"
                    )}
                  >
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Inbox Card */}
          <section className="mb-6">
            <button
              onClick={() => setActiveTab("inbox")}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-background-secondary p-4 transition-colors active:bg-background-tertiary"
            >
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5 text-foreground-secondary" />
                <span className="text-sm font-medium text-foreground">Inbox</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-secondary">5 items</span>
                <ArrowRight className="h-4 w-4 text-foreground-secondary" />
              </div>
            </button>
          </section>

          {/* Projects Horizontal Scroll */}
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground-secondary">
              Projects
            </h2>
            <div className="-mx-4 overflow-x-auto px-4 pb-2">
              <div className="flex gap-3">
                {projects.map((project) => (
                  <button
                    key={project.name}
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background-secondary px-4 py-3 transition-colors active:bg-background-tertiary"
                  >
                    <span className={cn("h-2.5 w-2.5 rounded-full", project.color)} />
                    <span className="text-sm font-medium text-foreground">{project.name}</span>
                    <span className="text-xs text-foreground-secondary">{project.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Tab Bar */}
      <nav className="flex h-16 shrink-0 items-center justify-around border-t border-border bg-background-secondary px-2">
        <TabButton
          icon={LayoutDashboard}
          label="Dashboard"
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
        />
        <TabButton
          icon={Inbox}
          label="Inbox"
          active={activeTab === "inbox"}
          onClick={() => {
            setActiveTab("inbox")
            onViewChange("inbox")
          }}
        />
        <TabButton
          icon={CheckSquare}
          label="Tasks"
          active={activeTab === "tasks"}
          onClick={() => {
            setActiveTab("tasks")
            onViewChange("tasks")
          }}
        />
        <TabButton
          icon={FolderOpen}
          label="Projects"
          active={activeTab === "projects"}
          onClick={() => setActiveTab("projects")}
        />
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-64 bg-background-secondary p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-[6px] text-foreground-secondary transition-colors active:bg-background-tertiary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {[
                { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" as ViewType },
                { icon: Inbox, label: "Inbox", view: "inbox" as ViewType },
                { icon: CheckSquare, label: "All Tasks", view: "tasks" as ViewType },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onViewChange(item.view)
                    setMenuOpen(false)
                  }}
                  className="flex items-center gap-3 rounded-[6px] px-3 py-3 text-foreground-secondary transition-colors active:bg-background-tertiary active:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface TabButtonProps {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
}

function TabButton({ icon: Icon, label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-11 min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-[6px] px-3 transition-colors",
        active ? "text-accent-blue" : "text-foreground-secondary"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}
