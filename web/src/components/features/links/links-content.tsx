"use client"

import { useState } from "react"
import {
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  X,
  Link2,
  MousePointerClick,
  FolderKanban,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TemplateEditor } from "@/components/features/links/template-editor"
import type { LinkId, DescriptionTemplateId } from "@/types/branded"
import type {
  Link,
  DescriptionTemplate,
  ProjectWithStats,
  CreateLinkInput,
  UpdateLinkInput,
  CreateDescriptionTemplateInput,
  UpdateDescriptionTemplateInput,
  LinkCategory,
} from "@/types/domain"

const CATEGORIES: { label: string; value: LinkCategory | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Affiliate", value: "affiliate" },
  { label: "Social", value: "social" },
  { label: "Resource", value: "resource" },
  { label: "Other", value: "other" },
]

function getCategoryColor(category: LinkCategory | null): string {
  switch (category) {
    case "affiliate":
      return "bg-accent-green/10 text-accent-green"
    case "social":
      return "bg-accent-blue/10 text-accent-blue"
    case "resource":
      return "bg-accent-purple/10 text-accent-purple"
    case "other":
      return "bg-foreground-secondary/10 text-foreground-secondary"
    default:
      return "bg-foreground-secondary/10 text-foreground-secondary"
  }
}

interface LinksContentProps {
  links: Link[]
  templates: DescriptionTemplate[]
  projects?: ProjectWithStats[]
  projectFilter?: string
  onProjectFilterChange?: (projectId?: string) => void
  onCreateLink: (input: CreateLinkInput) => void
  onUpdateLink: (id: LinkId, input: UpdateLinkInput) => void
  onDeleteLink: (id: LinkId) => void
  onLinkClick?: (id: LinkId) => void
  onCreateTemplate: (input: CreateDescriptionTemplateInput) => void
  onUpdateTemplate: (id: DescriptionTemplateId, input: UpdateDescriptionTemplateInput) => void
  onDeleteTemplate: (id: DescriptionTemplateId) => void
  isCreatingLink: boolean
  isCreatingTemplate: boolean
}

export function LinksContent({
  links,
  templates,
  projects,
  projectFilter,
  onProjectFilterChange,
  onCreateLink,
  onUpdateLink,
  onDeleteLink,
  onLinkClick,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  isCreatingLink,
  isCreatingTemplate,
}: LinksContentProps) {
  const [activeTab, setActiveTab] = useState<"links" | "templates">("links")
  const [categoryFilter, setCategoryFilter] = useState<LinkCategory | undefined>(undefined)
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [editingLinkId, setEditingLinkId] = useState<LinkId | null>(null)
  const [formLabel, setFormLabel] = useState("")
  const [formUrl, setFormUrl] = useState("")
  const [formCategory, setFormCategory] = useState<LinkCategory>("affiliate")

  const filteredLinks = categoryFilter
    ? links.filter((l) => l.category === categoryFilter)
    : links

  const handleAddLink = () => {
    if (formLabel.trim() && formUrl.trim()) {
      onCreateLink({
        label: formLabel.trim(),
        url: formUrl.trim(),
        category: formCategory,
      })
      setFormLabel("")
      setFormUrl("")
      setIsAddingLink(false)
    }
  }

  const handleEditLink = (link: Link) => {
    setEditingLinkId(link.id)
    setFormLabel(link.label)
    setFormUrl(link.url)
    setFormCategory(link.category ?? "other")
  }

  const handleSaveEdit = () => {
    if (editingLinkId && formLabel.trim() && formUrl.trim()) {
      onUpdateLink(editingLinkId, {
        label: formLabel.trim(),
        url: formUrl.trim(),
        category: formCategory,
      })
      setEditingLinkId(null)
      setFormLabel("")
      setFormUrl("")
    }
  }

  const cancelForm = () => {
    setIsAddingLink(false)
    setEditingLinkId(null)
    setFormLabel("")
    setFormUrl("")
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Links</h1>
        {activeTab === "links" && (
          <button
            onClick={() => {
              setIsAddingLink(true)
              setFormLabel("")
              setFormUrl("")
              setFormCategory("affiliate")
            }}
            disabled={isCreatingLink}
            className="flex items-center gap-2 rounded-[6px] bg-accent-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Link
          </button>
        )}
        {activeTab === "templates" && (
          <button
            onClick={() =>
              onCreateTemplate({ name: "New Template", content: "" })
            }
            disabled={isCreatingTemplate}
            className="flex items-center gap-2 rounded-[6px] bg-accent-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("links")}
          className={cn(
            "border-b-2 pb-3 text-sm font-medium transition-colors",
            activeTab === "links"
              ? "border-accent-blue text-foreground"
              : "border-transparent text-foreground-secondary hover:text-foreground"
          )}
        >
          Links
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={cn(
            "border-b-2 pb-3 text-sm font-medium transition-colors",
            activeTab === "templates"
              ? "border-accent-blue text-foreground"
              : "border-transparent text-foreground-secondary hover:text-foreground"
          )}
        >
          Templates
        </button>
      </div>

      {activeTab === "links" && (
        <>
          {/* Filters */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={cn(
                    "rounded-[6px] px-3 py-1.5 text-sm transition-colors",
                    categoryFilter === cat.value
                      ? "bg-background-tertiary text-foreground"
                      : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {projects && projects.length > 0 && onProjectFilterChange && (
              <div className="relative ml-auto">
                <FolderKanban className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary pointer-events-none" />
                <select
                  value={projectFilter ?? ''}
                  onChange={(e) => onProjectFilterChange(e.target.value || undefined)}
                  className="h-9 appearance-none rounded-[6px] border border-border bg-background pl-9 pr-8 text-sm text-foreground focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id as string} value={p.id as string}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Add link form */}
          {isAddingLink && (
            <div className="mb-4 rounded-[8px] border border-accent-blue/30 bg-background-secondary p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div>
                  <label className="mb-1 block text-xs text-foreground-secondary">
                    Label
                  </label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="My affiliate link"
                    className="h-9 w-full rounded-[6px] border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-foreground-secondary">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="h-9 w-full rounded-[6px] border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-foreground-secondary">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as LinkCategory)
                    }
                    className="h-9 rounded-[6px] border border-border bg-background px-3 text-sm text-foreground focus:border-accent-blue focus:outline-none"
                  >
                    <option value="affiliate">Affiliate</option>
                    <option value="social">Social</option>
                    <option value="resource">Resource</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 justify-end">
                <button
                  onClick={cancelForm}
                  className="rounded-[6px] px-3 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLink}
                  disabled={!formLabel.trim() || !formUrl.trim()}
                  className="rounded-[6px] bg-accent-blue px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Links list */}
          {filteredLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-background-tertiary">
                <Link2 className="h-6 w-6 text-foreground-secondary" />
              </div>
              <p className="text-sm font-medium text-foreground">No links yet</p>
              <p className="mt-1 text-sm text-foreground-secondary">
                Add your first link to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="group flex items-center justify-between rounded-[8px] border border-border bg-background-secondary p-4 transition-colors hover:border-foreground-secondary/30"
                >
                  {editingLinkId === link.id ? (
                    <div className="flex-1 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                        <input
                          type="text"
                          value={formLabel}
                          onChange={(e) => setFormLabel(e.target.value)}
                          className="h-8 rounded-[6px] border border-border bg-background px-3 text-sm text-foreground focus:border-accent-blue focus:outline-none"
                          autoFocus
                        />
                        <input
                          type="url"
                          value={formUrl}
                          onChange={(e) => setFormUrl(e.target.value)}
                          className="h-8 rounded-[6px] border border-border bg-background px-3 text-sm text-foreground focus:border-accent-blue focus:outline-none"
                        />
                        <select
                          value={formCategory}
                          onChange={(e) =>
                            setFormCategory(e.target.value as LinkCategory)
                          }
                          className="h-8 rounded-[6px] border border-border bg-background px-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
                        >
                          <option value="affiliate">Affiliate</option>
                          <option value="social">Social</option>
                          <option value="resource">Resource</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelForm}
                          className="flex h-7 items-center gap-1 rounded-[4px] px-2 text-xs text-foreground-secondary hover:bg-background-tertiary"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="flex h-7 items-center gap-1 rounded-[4px] bg-accent-blue px-2 text-xs text-white hover:bg-accent-blue/90"
                        >
                          <Check className="h-3 w-3" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {link.label}
                          </span>
                          {link.category && (
                            <span
                              className={cn(
                                "rounded-[4px] px-1.5 py-0.5 text-xs font-medium",
                                getCategoryColor(link.category)
                              )}
                            >
                              {link.category}
                            </span>
                          )}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onLinkClick?.(link.id)}
                          className="mt-0.5 flex items-center gap-1 text-sm text-foreground-secondary hover:text-accent-blue"
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-foreground-secondary">
                          <MousePointerClick className="h-3 w-3" />
                          {link.clickCount}
                        </div>
                        <div className="hidden items-center gap-1 group-hover:flex">
                          <button
                            onClick={() => handleEditLink(link)}
                            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteLink(link.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-foreground-secondary hover:bg-background-tertiary hover:text-accent-red"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "templates" && (
        <TemplateEditor
          templates={templates}
          links={links}
          onCreateTemplate={onCreateTemplate}
          onUpdateTemplate={onUpdateTemplate}
          onDeleteTemplate={onDeleteTemplate}
        />
      )}
    </div>
  )
}
