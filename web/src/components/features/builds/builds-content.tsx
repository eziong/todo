"use client"

import { useState, useEffect } from "react"
import {
  Play,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2,
  Hammer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NewBuildModal } from "@/components/features/builds/new-build-modal"
import { WebhookConfigsSection } from "@/components/features/builds/webhook-configs-section"
import type { BuildId } from "@/types/branded"
import type {
  BuildCommand,
  BuildWithProject,
  ProjectWithStats,
  CreateBuildInput,
} from "@/types/domain"

// --- Helpers ---

function formatBuildTime(dateStr: string | null): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMinutes < 1) return "Started just now"
  if (diffMinutes < 60) return `Started ${diffMinutes}m ago`
  if (diffHours < 24) return `Started ${diffHours}h ago`
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function formatDuration(startedAt: string | null, finishedAt: string | null): string | null {
  if (!startedAt || !finishedAt) return null
  const diffMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds} seconds`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

// --- Props ---

interface BuildsContentProps {
  builds: BuildWithProject[]
  projects: ProjectWithStats[]
  buildCommands: BuildCommand[]
  projectId?: string
  onCreateBuild: (input: CreateBuildInput) => void
  onDeleteBuild: (id: BuildId) => void
  isCreatingBuild: boolean
}

export function BuildsContent({
  builds,
  projects,
  buildCommands,
  projectId,
  onCreateBuild,
  onDeleteBuild,
  isCreatingBuild,
}: BuildsContentProps) {
  const [activeTab, setActiveTab] = useState<"builds" | "webhooks">("builds")
  const [expandedBuilds, setExpandedBuilds] = useState<Set<string>>(() => {
    const first = builds[0]
    return first ? new Set([first.id]) : new Set()
  })
  const [cursorVisible, setCursorVisible] = useState(true)
  const [newBuildModalOpen, setNewBuildModalOpen] = useState(false)

  const hasRunning = builds.some((b) => b.status === "running")

  useEffect(() => {
    if (!hasRunning) return
    const interval = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 530)
    return () => clearInterval(interval)
  }, [hasRunning])

  const toggleBuildExpanded = (buildId: string) => {
    setExpandedBuilds((prev) => {
      const next = new Set(prev)
      if (next.has(buildId)) {
        next.delete(buildId)
      } else {
        next.add(buildId)
      }
      return next
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "border-l-accent-yellow"
      case "success": return "border-l-accent-green"
      case "failed": return "border-l-accent-red"
      default: return "border-l-foreground-secondary/20"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-accent-yellow/10 px-2 py-0.5 text-xs font-medium text-accent-yellow">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
          </span>
        )
      case "success":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-accent-green/10 px-2 py-0.5 text-xs font-medium text-accent-green">
            <Check className="h-3 w-3" />
            Success
          </span>
        )
      case "failed":
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-accent-red/10 px-2 py-0.5 text-xs font-medium text-accent-red">
            <X className="h-3 w-3" />
            Failed
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-foreground-secondary/10 px-2 py-0.5 text-xs font-medium text-foreground-secondary">
            Pending
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Builds</h1>
        <button
          onClick={() => setNewBuildModalOpen(true)}
          disabled={projects.length === 0}
          className="flex h-9 items-center gap-2 rounded-lg bg-accent-blue px-4 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          New Build
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("builds")}
          className={cn(
            "border-b-2 pb-2 text-sm font-medium transition-colors",
            activeTab === "builds"
              ? "border-accent-blue text-foreground"
              : "border-transparent text-foreground-secondary hover:text-foreground"
          )}
        >
          Builds
          {builds.length > 0 && (
            <span className="ml-1.5 text-foreground-secondary">({builds.length})</span>
          )}
        </button>
        {projectId && (
          <button
            onClick={() => setActiveTab("webhooks")}
            className={cn(
              "border-b-2 pb-2 text-sm font-medium transition-colors",
              activeTab === "webhooks"
                ? "border-accent-blue text-foreground"
                : "border-transparent text-foreground-secondary hover:text-foreground"
            )}
          >
            Webhooks
            {buildCommands.length > 0 && (
              <span className="ml-1.5 text-foreground-secondary">({buildCommands.length})</span>
            )}
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === "webhooks" && projectId ? (
        <WebhookConfigsSection projectId={projectId} />
      ) : (
        builds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-tertiary">
              <Hammer className="h-6 w-6 text-foreground-secondary" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No builds yet</p>
            <p className="mt-1 text-sm text-foreground-secondary">
              Start a build to track your project progress.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {builds.map((build) => {
              const isExpanded = expandedBuilds.has(build.id)
              const duration = formatDuration(build.startedAt, build.finishedAt)
              const logLines = build.log?.split("\n").filter(Boolean) ?? []

              return (
                <div
                  key={build.id}
                  className={cn(
                    "overflow-hidden rounded-xl border border-border bg-background-secondary border-l-4",
                    getStatusColor(build.status)
                  )}
                >
                  {/* Build header */}
                  <button
                    onClick={() => toggleBuildExpanded(build.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-background-tertiary/50"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-foreground-secondary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-foreground-secondary" />
                      )}
                      <span className="font-medium text-foreground">
                        Build #{build.buildNumber}
                      </span>
                      {getStatusBadge(build.status)}
                      <span className="text-xs text-foreground-secondary">
                        {build.projectName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                      <span>{formatBuildTime(build.startedAt)}</span>
                      {duration && (
                        <>
                          <span>·</span>
                          <span>{duration}</span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {/* Terminal log area */}
                      {logLines.length > 0 && (
                        <div className="bg-background p-4">
                          <div className="rounded-lg bg-[#0A0A0B] p-4">
                            <pre className="font-mono text-sm leading-relaxed">
                              {logLines.map((line, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    line.includes("✓") || line.includes("success")
                                      ? "text-accent-green"
                                      : line.includes("Error") || line.includes("failed")
                                        ? "text-accent-red"
                                        : "text-accent-green/80"
                                  )}
                                >
                                  {line}
                                </div>
                              ))}
                              {build.status === "running" && (
                                <span
                                  className={cn(
                                    "inline-block w-2 h-4 bg-accent-green ml-0.5 align-middle",
                                    cursorVisible ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              )}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {build.notes && (
                        <div className="border-t border-border px-4 py-3">
                          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                            Notes
                          </div>
                          <p className="text-sm text-foreground-secondary">
                            {build.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* New Build Modal */}
      <NewBuildModal
        open={newBuildModalOpen}
        onOpenChange={setNewBuildModalOpen}
        projects={projects}
        buildCommands={buildCommands}
        onStartBuild={onCreateBuild}
        isPending={isCreatingBuild}
        defaultProjectId={projectId}
      />
    </div>
  )
}
