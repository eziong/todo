"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Check,
  Code2,
  Youtube,
  PenTool,
  Folder,
} from "lucide-react"
import type {
  Project,
  ProjectFeature,
  ProjectTemplate,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/types/domain"
import { PROJECT_TEMPLATES } from "@/types/domain"

const PROJECT_COLORS = [
  { value: "blue", className: "bg-accent-blue" },
  { value: "purple", className: "bg-accent-purple" },
  { value: "green", className: "bg-accent-green" },
  { value: "orange", className: "bg-accent-orange" },
  { value: "red", className: "bg-accent-red" },
  { value: "pink", className: "bg-accent-pink" },
] as const

const ALL_FEATURES: { value: ProjectFeature; label: string }[] = [
  { value: "tasks", label: "Tasks" },
  { value: "builds", label: "Builds" },
  { value: "content", label: "Content" },
  { value: "assets", label: "Assets" },
  { value: "youtube", label: "YouTube" },
  { value: "revenue", label: "Revenue" },
  { value: "notes", label: "Notes" },
  { value: "links", label: "Links" },
]

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  dev: Code2,
  youtube: Youtube,
  content: PenTool,
  general: Folder,
}

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  onSubmit: (input: CreateProjectInput | UpdateProjectInput) => void
  isPending: boolean
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
  isPending,
}: ProjectFormDialogProps) {
  const isEditing = Boolean(project)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("blue")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [features, setFeatures] = useState<ProjectFeature[]>([])

  useEffect(() => {
    if (open) {
      if (project) {
        setName(project.name)
        setDescription(project.description ?? "")
        setColor(project.color ?? "blue")
        setFeatures(project.features)
        setSelectedTemplate(null)
      } else {
        setName("")
        setDescription("")
        setColor("blue")
        setSelectedTemplate("general")
        const generalTemplate = PROJECT_TEMPLATES.find((t) => t.id === "general")
        setFeatures(generalTemplate?.features ?? ["tasks", "notes", "links"])
      }
    }
  }, [open, project])

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template.id)
    setFeatures([...template.features])
  }

  const handleFeatureToggle = (feature: ProjectFeature) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    )
    setSelectedTemplate(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    onSubmit({
      name: trimmed,
      description: description.trim() || undefined,
      color,
      features,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background-secondary sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditing ? "Edit Project" : "New Project"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Template Selection (create mode only) */}
            {!isEditing && (
              <div className="space-y-2">
                <Label className="text-foreground-secondary">Template</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_TEMPLATES.map((template) => {
                    const Icon = TEMPLATE_ICONS[template.id] ?? Folder
                    const isSelected = selectedTemplate === template.id
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateSelect(template)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                          isSelected
                            ? "border-accent-blue bg-accent-blue/5"
                            : "border-border hover:border-foreground-secondary/30 hover:bg-background-tertiary"
                        )}
                      >
                        <Icon className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          isSelected ? "text-accent-blue" : "text-foreground-secondary"
                        )} />
                        <div className="min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-accent-blue" : "text-foreground"
                          )}>
                            {template.name}
                          </p>
                          <p className="mt-0.5 text-xs text-foreground-secondary line-clamp-1">
                            {template.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-foreground-secondary">
                Name
              </Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                autoFocus
                className="border-border bg-background text-foreground placeholder:text-foreground-secondary/60"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="project-desc" className="text-foreground-secondary">
                Description
              </Label>
              <Textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={2}
                className="border-border bg-background text-foreground placeholder:text-foreground-secondary/60"
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label className="text-foreground-secondary">Color</Label>
              <div className="flex items-center gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                      c.className,
                      color === c.value
                        ? "ring-2 ring-white/30 ring-offset-2 ring-offset-background-secondary"
                        : "opacity-60 hover:opacity-100"
                    )}
                  >
                    {color === c.value && (
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label className="text-foreground-secondary">Features</Label>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {ALL_FEATURES.map((f) => (
                  <label
                    key={f.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={features.includes(f.value)}
                      onCheckedChange={() => handleFeatureToggle(f.value)}
                      className="border-foreground-secondary/40 data-[state=checked]:bg-accent-blue data-[state=checked]:border-accent-blue"
                    />
                    <span className="text-sm text-foreground">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>


          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-foreground-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isPending}
              className="bg-accent-blue text-white hover:bg-accent-blue/90"
            >
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
