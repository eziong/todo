"use client"

import { useState, useEffect } from "react"
import {
  ChevronDown,
  Check,
  Play,
  Webhook,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BuildCommand, ProjectWithStats, CreateBuildInput } from "@/types/domain"

// --- Helpers ---

const METHOD_COLORS: Record<string, string> = {
  GET: "text-accent-green",
  POST: "text-accent-blue",
  PUT: "text-accent-yellow",
  PATCH: "text-accent-purple",
  DELETE: "text-accent-red",
}

// --- Props ---

interface NewBuildModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectWithStats[]
  buildCommands: BuildCommand[]
  onStartBuild: (input: CreateBuildInput) => void
  isPending: boolean
  defaultProjectId?: string
}

export function NewBuildModal({
  open,
  onOpenChange,
  projects,
  buildCommands,
  onStartBuild,
  isPending,
  defaultProjectId,
}: NewBuildModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>("")
  const [notes, setNotes] = useState("")

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setSelectedProjectId(defaultProjectId ?? projects[0]?.id ?? "")
      setSelectedWebhookId("")
      setNotes("")
    }
  }, [open, projects])

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  // Filter webhooks for selected project
  const projectWebhooks = buildCommands.filter(
    (bc) => bc.projectId === selectedProjectId
  )

  const selectedWebhook = projectWebhooks.find((w) => w.id === selectedWebhookId)

  const handleStartBuild = () => {
    if (!selectedProjectId) return
    onStartBuild({
      projectId: selectedProjectId,
      buildCommandId: selectedWebhookId || undefined,
      notes: notes || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[560px] gap-0 overflow-hidden rounded-xl border-border bg-background-secondary p-0 shadow-2xl backdrop-blur-sm"
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold text-foreground">
            New Build{selectedProject ? ` — ${selectedProject.name}` : ""}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-5 p-5">
          {/* Project selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Project</label>
            <div className="relative">
              <button
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="flex h-10 w-full items-center justify-between rounded-[6px] border border-border bg-background px-3 text-sm transition-colors hover:bg-background-tertiary"
              >
                <span className="text-foreground">
                  {selectedProject?.name ?? "Select a project"}
                </span>
                <ChevronDown className="h-4 w-4 text-foreground-secondary" />
              </button>

              {projectDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProjectDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-[8px] border border-border bg-background-secondary p-1 shadow-lg">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProjectId(project.id)
                          setProjectDropdownOpen(false)
                          setSelectedWebhookId("")
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-[4px] px-3 py-2 text-left text-sm transition-colors",
                          selectedProjectId === project.id
                            ? "bg-accent-blue/10 text-accent-blue"
                            : "text-foreground hover:bg-background-tertiary"
                        )}
                      >
                        <span>{project.name}</span>
                        {selectedProjectId === project.id && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Webhook selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Webhook</label>
            {projectWebhooks.length > 0 ? (
              <>
                <Select
                  value={selectedWebhookId}
                  onValueChange={setSelectedWebhookId}
                >
                  <SelectTrigger className="border-border bg-background text-foreground">
                    <SelectValue placeholder="Select a webhook config" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectWebhooks.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        <span className="flex items-center gap-2">
                          <span className={cn("text-xs font-semibold", METHOD_COLORS[wh.method])}>
                            {wh.method}
                          </span>
                          {wh.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWebhook && (
                  <div className="rounded-[6px] border border-border bg-background px-3 py-2">
                    <p className="truncate font-mono text-xs text-foreground-secondary">
                      {selectedWebhook.method} {selectedWebhook.url}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-[6px] border border-dashed border-border px-3 py-3">
                <Webhook className="h-4 w-4 text-foreground-secondary" />
                <p className="text-sm text-foreground-secondary">
                  No webhooks configured for this project. Add one in project settings.
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add release notes..."
              className="h-20 w-full resize-none rounded-[6px] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-[6px] px-4 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleStartBuild}
            disabled={!selectedProjectId || !selectedWebhookId || isPending}
            className="flex h-9 items-center gap-2 rounded-[6px] bg-accent-blue px-4 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Start Build
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
