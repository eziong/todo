"use client"

import { useState } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Pencil,
  Trash2,
  Eye,
  Star,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { DescriptionTemplateId } from "@/types/branded"
import type {
  Link,
  DescriptionTemplate,
  CreateDescriptionTemplateInput,
  UpdateDescriptionTemplateInput,
} from "@/types/domain"

interface TemplateEditorProps {
  templates: DescriptionTemplate[]
  links: Link[]
  onCreateTemplate: (input: CreateDescriptionTemplateInput) => void
  onUpdateTemplate: (id: DescriptionTemplateId, input: UpdateDescriptionTemplateInput) => void
  onDeleteTemplate: (id: DescriptionTemplateId) => void
}

function resolvePlaceholders(content: string, links: Link[]): string {
  return content.replace(/\{\{link:([^}]+)\}\}/g, (match, label) => {
    const link = links.find(
      (l) => l.label.toLowerCase() === label.trim().toLowerCase()
    )
    return link ? link.url : match
  })
}

export function TemplateEditor({
  templates,
  links,
  onUpdateTemplate,
  onDeleteTemplate,
}: TemplateEditorProps) {
  const [selectedId, setSelectedId] = useState<DescriptionTemplateId | null>(
    templates[0]?.id ?? null
  )
  const [isPreview, setIsPreview] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const selected = templates.find((t) => t.id === selectedId)

  const scheduleAutoSave = (id: DescriptionTemplateId, updates: UpdateDescriptionTemplateInput) => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    const timer = setTimeout(() => {
      onUpdateTemplate(id, updates)
    }, 1000)
    setAutoSaveTimer(timer)
  }

  const handleNameChange = (value: string) => {
    if (selected) {
      scheduleAutoSave(selected.id, { name: value })
    }
  }

  const handleContentChange = (value: string) => {
    if (selected) {
      scheduleAutoSave(selected.id, { content: value })
    }
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-background-tertiary">
          <FileText className="h-6 w-6 text-foreground-secondary" />
        </div>
        <p className="text-sm font-medium text-foreground">No templates yet</p>
        <p className="mt-1 text-sm text-foreground-secondary">
          Create a template for video descriptions
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Template list */}
      <div className="w-56 shrink-0 space-y-1">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => {
              setSelectedId(template.id)
              setIsPreview(false)
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-sm text-left transition-colors",
              selectedId === template.id
                ? "bg-background-tertiary text-foreground"
                : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{template.name}</span>
            {template.isDefault && (
              <Star className="h-3 w-3 shrink-0 text-accent-yellow" />
            )}
          </button>
        ))}
      </div>

      {/* Editor */}
      {selected && (
        <div className="flex-1 rounded-[8px] border border-border bg-background-secondary">
          {/* Template header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <input
              type="text"
              defaultValue={selected.name}
              key={selected.id + "-name"}
              onChange={(e) => handleNameChange(e.target.value)}
              className="border-none bg-transparent text-sm font-medium text-foreground focus:outline-none"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-[4px] transition-colors",
                  isPreview
                    ? "bg-background-tertiary text-foreground"
                    : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                )}
                aria-label={isPreview ? "Edit" : "Preview"}
              >
                {isPreview ? (
                  <Pencil className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => {
                  onDeleteTemplate(selected.id)
                  setSelectedId(
                    templates.find((t) => t.id !== selected.id)?.id ?? null
                  )
                }}
                className="flex h-7 w-7 items-center justify-center rounded-[4px] text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-accent-red"
                aria-label="Delete template"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Template body */}
          <div className="p-4">
            {isPreview ? (
              <div className="prose prose-invert max-w-none prose-sm prose-p:text-foreground-secondary prose-a:text-accent-blue">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {resolvePlaceholders(selected.content, links) ||
                    "*Empty template*"}
                </Markdown>
              </div>
            ) : (
              <>
                <textarea
                  defaultValue={selected.content}
                  key={selected.id + "-content"}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Write your template... Use {{link:Label}} to insert link URLs"
                  className="min-h-[300px] w-full resize-none border-none bg-transparent font-mono text-sm text-foreground placeholder:text-foreground-secondary/50 focus:outline-none leading-relaxed"
                />
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-xs text-foreground-secondary">
                    Use <code className="rounded bg-background-tertiary px-1 py-0.5 text-accent-purple">{"{{link:Label}}"}</code> to
                    insert a link URL. The label must match an existing link.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
