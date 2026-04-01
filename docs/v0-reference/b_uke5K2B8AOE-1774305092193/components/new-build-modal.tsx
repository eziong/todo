"use client"

import { useState } from "react"
import { 
  X, 
  ChevronDown, 
  Check,
  Play,
  GripVertical
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BuildIdea {
  id: string
  title: string
  status: "new" | "considering" | "planned"
  selected: boolean
}

const initialIdeas: BuildIdea[] = [
  { id: "i1", title: "Dark mode toggle", status: "considering", selected: true },
  { id: "i2", title: "Keyboard shortcuts guide", status: "new", selected: true },
  { id: "i3", title: "Mobile companion app", status: "planned", selected: false },
  { id: "i4", title: "Export to CSV", status: "new", selected: false },
]

const buildCommands = [
  { id: "build", label: "npm run build" },
  { id: "build:prod", label: "npm run build:prod" },
  { id: "custom", label: "Custom command..." }
]

interface NewBuildModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName?: string
  onStartBuild?: (config: { command: string; ideas: string[]; notes: string }) => void
}

export function NewBuildModal({ 
  open, 
  onOpenChange, 
  projectName = "Command Center",
  onStartBuild 
}: NewBuildModalProps) {
  const [selectedCommand, setSelectedCommand] = useState(buildCommands[0])
  const [commandDropdownOpen, setCommandDropdownOpen] = useState(false)
  const [ideas, setIdeas] = useState<BuildIdea[]>(initialIdeas)
  const [notes, setNotes] = useState("")

  const toggleIdea = (ideaId: string) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === ideaId ? { ...idea, selected: !idea.selected } : idea
    ))
  }

  const getStatusColor = (status: BuildIdea["status"]) => {
    switch (status) {
      case "new": return "text-accent-blue"
      case "considering": return "text-accent-yellow"
      case "planned": return "text-accent-purple"
    }
  }

  const getStatusLabel = (status: BuildIdea["status"]) => {
    switch (status) {
      case "new": return "New"
      case "considering": return "Considering"
      case "planned": return "Planned"
    }
  }

  const handleStartBuild = () => {
    const selectedIdeas = ideas.filter(i => i.selected).map(i => i.id)
    onStartBuild?.({
      command: selectedCommand.label,
      ideas: selectedIdeas,
      notes
    })
    onOpenChange(false)
  }

  const selectedCount = ideas.filter(i => i.selected).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="max-w-[560px] gap-0 overflow-hidden rounded-xl border-border bg-background-secondary p-0 shadow-2xl backdrop-blur-sm"
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold text-foreground">
            New Build — {projectName}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-[4px] p-1 text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-5 p-5">
          {/* Build Command selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Command</label>
            <div className="relative">
              <button
                onClick={() => setCommandDropdownOpen(!commandDropdownOpen)}
                className="flex h-10 w-full items-center justify-between rounded-[6px] border border-border bg-background px-3 text-sm transition-colors hover:bg-background-tertiary"
              >
                <span className="font-mono text-foreground">{selectedCommand.label}</span>
                <ChevronDown className="h-4 w-4 text-foreground-secondary" />
              </button>
              
              {commandDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setCommandDropdownOpen(false)} 
                  />
                  <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-[8px] border border-border bg-background-secondary p-1 shadow-lg">
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
                            : "text-foreground hover:bg-background-tertiary"
                        )}
                      >
                        <span className="font-mono">{cmd.label}</span>
                        {selectedCommand.id === cmd.id && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="font-mono text-xs text-foreground-secondary">
              ~/projects/command-center
            </p>
          </div>

          {/* Include Ideas section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Include Ideas</label>
            <p className="text-xs text-foreground-secondary">
              Select ideas to include in this build
            </p>
            
            {/* Scrollable checklist */}
            <div className="max-h-[180px] overflow-y-auto rounded-[6px] border border-border bg-background">
              {ideas.map(idea => (
                <button
                  key={idea.id}
                  onClick={() => toggleIdea(idea.id)}
                  className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-background-tertiary"
                >
                  {/* Drag handle (visible on hover) */}
                  <GripVertical className="h-4 w-4 text-foreground-secondary/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  {/* Checkbox */}
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                    idea.selected 
                      ? "border-accent-blue bg-accent-blue" 
                      : "border-border bg-background hover:border-foreground-secondary"
                  )}>
                    {idea.selected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  
                  {/* Title */}
                  <span className="flex-1 text-sm text-foreground">{idea.title}</span>
                  
                  {/* Status badge */}
                  <span className={cn(
                    "text-xs",
                    getStatusColor(idea.status)
                  )}>
                    {getStatusLabel(idea.status)}
                  </span>
                </button>
              ))}
            </div>
            
            <p className="text-xs text-foreground-secondary/60">
              Or drag ideas from the Ideas tab
            </p>
          </div>

          {/* Notes section */}
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
            className="flex h-9 items-center gap-2 rounded-[6px] bg-accent-blue px-4 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            <Play className="h-4 w-4" />
            Start Build
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
