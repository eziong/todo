"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { ContentType, ContentPlatform, CreateContentInput, ProjectWithStats } from "@/types/domain"

interface CreateContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectWithStats[]
  onCreateContent: (input: CreateContentInput) => void
  isCreating: boolean
  defaultProjectId?: string
}

export function CreateContentDialog({
  open,
  onOpenChange,
  projects,
  onCreateContent,
  isCreating,
  defaultProjectId,
}: CreateContentDialogProps) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState<ContentType>("video")
  const [platform, setPlatform] = useState<ContentPlatform>("youtube")
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onCreateContent({
      title: title.trim(),
      type,
      platform,
      projectId: projectId || undefined,
    })

    setTitle("")
    setType("video")
    setPlatform("youtube")
    setProjectId(defaultProjectId ?? "")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Content</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Content title..."
              className="h-9 w-full rounded-[6px] border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
              autoFocus
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ContentType)}
              className="h-9 w-full rounded-[6px] border border-border bg-background px-3 text-sm text-foreground focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            >
              <option value="video">Video</option>
              <option value="short">Short</option>
              <option value="post">Post</option>
              <option value="blog">Blog</option>
            </select>
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
              className="h-9 w-full rounded-[6px] border border-border bg-background px-3 text-sm text-foreground focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            >
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
              <option value="blog">Blog</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-9 w-full rounded-[6px] border border-border bg-background px-3 text-sm text-foreground focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id as string}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-[6px] px-4 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isCreating}
              className="rounded-[6px] bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
            >
              Create
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
