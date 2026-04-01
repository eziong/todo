"use client"

import { useState, useEffect } from "react"
import { 
  Play, 
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NewBuildModal } from "@/components/new-build-modal"

interface BuildIdea {
  id: string
  title: string
  completed: boolean
}

interface Build {
  id: string
  number: number
  status: "running" | "success" | "failed"
  startedAt: string
  duration?: string
  logs: string[]
  ideas: BuildIdea[]
  expanded: boolean
}

const initialBuilds: Build[] = [
  {
    id: "b3",
    number: 3,
    status: "running",
    startedAt: "Started 2 min ago",
    logs: [
      "> npm run build",
      "> Building pages...",
      "> Compiling /dashboard... ✓",
      "> Compiling /inbox... ✓",
      "> Compiling /tasks..."
    ],
    ideas: [
      { id: "i1", title: "Dark mode toggle", completed: true },
      { id: "i2", title: "Keyboard shortcuts", completed: true }
    ],
    expanded: true
  },
  {
    id: "b2",
    number: 2,
    status: "success",
    startedAt: "March 20, 2026",
    duration: "45 seconds",
    logs: [
      "> npm run build",
      "> Building pages...",
      "> Compiling /dashboard... ✓",
      "> Compiling /inbox... ✓",
      "> Compiling /tasks... ✓",
      "> Generating static pages...",
      "> Build completed successfully!"
    ],
    ideas: [
      { id: "i3", title: "Task detail panel", completed: true },
      { id: "i4", title: "Command palette", completed: true },
      { id: "i5", title: "Sidebar navigation", completed: true }
    ],
    expanded: false
  },
  {
    id: "b1",
    number: 1,
    status: "failed",
    startedAt: "March 18, 2026",
    duration: "12 seconds",
    logs: [
      "> npm run build",
      "> Building pages...",
      "> Error: Module not found: 'lucide-react'",
      "> Build failed with exit code 1"
    ],
    ideas: [],
    expanded: false
  }
]

const buildCommands = [
  { id: "build", label: "npm run build" },
  { id: "dev", label: "npm run dev" },
  { id: "lint", label: "npm run lint" },
  { id: "test", label: "npm run test" }
]

export function BuildsContent() {
  const [builds, setBuilds] = useState<Build[]>(initialBuilds)
  const [selectedCommand, setSelectedCommand] = useState(buildCommands[0])
  const [commandDropdownOpen, setCommandDropdownOpen] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)
  const [newBuildModalOpen, setNewBuildModalOpen] = useState(false)

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  const toggleBuildExpanded = (buildId: string) => {
    setBuilds(prev => prev.map(b => 
      b.id === buildId ? { ...b, expanded: !b.expanded } : b
    ))
  }

  const getStatusColor = (status: Build["status"]) => {
    switch (status) {
      case "running": return "border-l-accent-yellow"
      case "success": return "border-l-accent-green"
      case "failed": return "border-l-accent-red"
    }
  }

  const getStatusBadge = (status: Build["status"]) => {
    switch (status) {
      case "running":
        return (
          <span className="flex items-center gap-1.5 rounded-[4px] bg-accent-yellow/10 px-2 py-0.5 text-xs font-medium text-accent-yellow">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
          </span>
        )
      case "success":
        return (
          <span className="flex items-center gap-1.5 rounded-[4px] bg-accent-green/10 px-2 py-0.5 text-xs font-medium text-accent-green">
            <Check className="h-3 w-3" />
            Success
          </span>
        )
      case "failed":
        return (
          <span className="flex items-center gap-1.5 rounded-[4px] bg-accent-red/10 px-2 py-0.5 text-xs font-medium text-accent-red">
            <X className="h-3 w-3" />
            Failed
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Builds</h1>
        
        <div className="flex items-center gap-2">
          {/* Command dropdown */}
          <div className="relative">
            <button
              onClick={() => setCommandDropdownOpen(!commandDropdownOpen)}
              className="flex h-9 items-center gap-2 rounded-[6px] border border-border bg-background-secondary px-3 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
            >
              <span className="font-mono text-xs">{selectedCommand.label}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {commandDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setCommandDropdownOpen(false)} 
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-[8px] border border-border bg-background-secondary p-1 shadow-lg">
                  {buildCommands.map(cmd => (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        setSelectedCommand(cmd)
                        setCommandDropdownOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-[4px] px-3 py-2 text-left text-sm transition-colors",
                        selectedCommand.id === cmd.id 
                          ? "bg-accent-blue/10 text-accent-blue" 
                          : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                      )}
                    >
                      <span className="font-mono text-xs">{cmd.label}</span>
                      {selectedCommand.id === cmd.id && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Run Build button */}
          <button 
            onClick={() => setNewBuildModalOpen(true)}
            className="flex h-9 items-center gap-2 rounded-[6px] bg-accent-blue px-4 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            <Play className="h-4 w-4" />
            Run Build
          </button>
        </div>
      </div>

      {/* Build list */}
      <div className="space-y-4">
        {builds.map(build => (
          <div
            key={build.id}
            className={cn(
              "overflow-hidden rounded-[8px] border border-border bg-background-secondary border-l-4",
              getStatusColor(build.status)
            )}
          >
            {/* Build header */}
            <button
              onClick={() => toggleBuildExpanded(build.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-background-tertiary/50"
            >
              <div className="flex items-center gap-3">
                {build.expanded ? (
                  <ChevronDown className="h-4 w-4 text-foreground-secondary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-foreground-secondary" />
                )}
                <span className="font-medium text-foreground">Build #{build.number}</span>
                {getStatusBadge(build.status)}
              </div>
              
              <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                <span>{build.startedAt}</span>
                {build.duration && (
                  <>
                    <span>·</span>
                    <span>{build.duration}</span>
                  </>
                )}
                {!build.expanded && build.ideas.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{build.ideas.length} ideas included</span>
                  </>
                )}
              </div>
            </button>

            {/* Expanded content */}
            {build.expanded && (
              <div className="border-t border-border">
                {/* Terminal log area */}
                <div className="bg-background p-4">
                  <div className="rounded-[6px] bg-[#0A0A0B] p-4">
                    <pre className="font-mono text-sm leading-relaxed">
                      {build.logs.map((line, idx) => (
                        <div key={idx} className={cn(
                          line.includes("✓") ? "text-accent-green" :
                          line.includes("Error") || line.includes("failed") ? "text-accent-red" :
                          "text-accent-green/80"
                        )}>
                          {line}
                        </div>
                      ))}
                      {build.status === "running" && (
                        <span className={cn(
                          "inline-block w-2 h-4 bg-accent-green ml-0.5 align-middle",
                          cursorVisible ? "opacity-100" : "opacity-0"
                        )} />
                      )}
                    </pre>
                  </div>
                </div>

                {/* Ideas included section */}
                {build.ideas.length > 0 && (
                  <div className="border-t border-border px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-wider text-foreground-secondary mb-2">
                      Ideas included:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {build.ideas.map(idea => (
                        <div
                          key={idea.id}
                          className="flex items-center gap-2 rounded-[4px] bg-background-tertiary px-2.5 py-1.5 text-sm"
                        >
                          <Check className="h-3.5 w-3.5 text-accent-green" />
                          <span className="text-foreground">{idea.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Build Modal */}
      <NewBuildModal 
        open={newBuildModalOpen} 
        onOpenChange={setNewBuildModalOpen}
        projectName="Command Center"
      />
    </div>
  )
}
