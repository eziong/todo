"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Plus,
  MoreHorizontal,
  Archive,
  Pencil,
  Trash2,
  ArchiveRestore,
  FolderOpen,
  CheckSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProjectFormDialog } from "@/components/features/projects/project-form-dialog"
import type { ProjectId } from "@/types/branded"
import type { ProjectWithStats, Project, CreateProjectInput, UpdateProjectInput } from "@/types/domain"

// --- Color utilities ---

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

// --- Props ---

interface ProjectsContentProps {
  projects: ProjectWithStats[]
  onCreateProject: (input: CreateProjectInput) => void
  onUpdateProject: (id: ProjectId, input: UpdateProjectInput) => void
  onDeleteProject: (id: ProjectId) => void
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function ProjectsContent({
  projects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  isCreating,
  isUpdating,
  isDeleting,
}: ProjectsContentProps) {
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<ProjectId | null>(null)
  const [deletingProjectId, setDeletingProjectId] = useState<ProjectId | null>(null)

  const activeProjects = projects.filter((p) => !p.archived)
  const archivedProjects = projects.filter((p) => p.archived)
  const displayProjects = showArchived ? archivedProjects : activeProjects

  const handleEdit = (project: Project) => {
    setMenuOpenId(null)
    setEditingProject(project)
    setFormOpen(true)
  }

  const handleNewProject = () => {
    setEditingProject(null)
    setFormOpen(true)
  }

  const handleFormSubmit = (input: CreateProjectInput | UpdateProjectInput) => {
    if (editingProject) {
      onUpdateProject(editingProject.id, input as UpdateProjectInput)
    } else {
      onCreateProject(input as CreateProjectInput)
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingProjectId) return
    onDeleteProject(deletingProjectId)
    setDeletingProjectId(null)
  }

  const deletingProject = deletingProjectId
    ? projects.find((p) => p.id === deletingProjectId)
    : null

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
          <div className="flex items-center gap-2">
            {archivedProjects.length > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-lg border border-border px-3 text-sm transition-colors",
                  showArchived
                    ? "bg-background-tertiary text-foreground"
                    : "bg-background-secondary text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                )}
              >
                <Archive className="h-4 w-4" />
                <span>Archived ({archivedProjects.length})</span>
              </button>
            )}
            <button
              onClick={handleNewProject}
              className="flex h-8 items-center gap-2 rounded-lg bg-accent-blue px-3 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Project grid */}
        {displayProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-tertiary">
              <FolderOpen className="h-6 w-6 text-foreground-secondary" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              {showArchived ? "No archived projects" : "No projects yet"}
            </p>
            <p className="mt-1 text-sm text-foreground-secondary">
              {showArchived
                ? "Archived projects will appear here."
                : "Create a project to organize your tasks."}
            </p>
            {!showArchived && (
              <button
                onClick={handleNewProject}
                className="mt-4 flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                menuOpen={menuOpenId === project.id}
                onMenuToggle={() =>
                  setMenuOpenId(menuOpenId === project.id ? null : project.id)
                }
                onMenuClose={() => setMenuOpenId(null)}
                onEdit={() => handleEdit(project)}
                onArchive={() => {
                  setMenuOpenId(null)
                  onUpdateProject(project.id, { archived: !project.archived })
                }}
                onDelete={() => {
                  setMenuOpenId(null)
                  setDeletingProjectId(project.id)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        onSubmit={handleFormSubmit}
        isPending={isCreating || isUpdating}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={Boolean(deletingProjectId)}
        onOpenChange={(open) => { if (!open) setDeletingProjectId(null) }}
      >
        <AlertDialogContent className="border-border bg-background-secondary">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground-secondary">
              Are you sure you want to delete{deletingProject ? ` "${deletingProject.name}"` : " this project"}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-accent-red text-white hover:bg-accent-red/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// --- ProjectCard ---

interface ProjectCardProps {
  project: ProjectWithStats
  menuOpen: boolean
  onMenuToggle: () => void
  onMenuClose: () => void
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}

function ProjectCard({
  project,
  menuOpen,
  onMenuToggle,
  onMenuClose,
  onEdit,
  onArchive,
  onDelete,
}: ProjectCardProps) {
  const totalTasks = project.todoCount + project.completedCount

  return (
    <div className="group relative">
      <Link
        href={`/projects/${project.id}`}
        className="block rounded-xl border border-border bg-background-secondary p-4 transition-colors hover:bg-background-tertiary"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <span
            className={cn("h-3 w-3 shrink-0 rounded-full", getProjectDotColor(project.color))}
          />
          <span className="flex-1 truncate text-sm font-medium text-foreground">
            {project.name}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="mt-2 line-clamp-2 text-sm text-foreground-secondary">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-foreground-secondary">
          <span className="flex items-center gap-1">
            <CheckSquare className="h-3.5 w-3.5" />
            {project.todoCount} open
          </span>
          {project.completedCount > 0 && (
            <span>
              {project.completedCount}/{totalTasks} done
            </span>
          )}
        </div>
      </Link>

      {/* Menu button */}
      <div className="absolute right-2 top-2">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onMenuToggle()
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-foreground-secondary transition-all",
            menuOpen
              ? "bg-background-tertiary text-foreground"
              : "opacity-0 hover:bg-background-tertiary hover:text-foreground group-hover:opacity-100"
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onMenuClose} />
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-background-secondary p-1 shadow-xl">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEdit()
                }}
                className="flex w-full items-center gap-2 rounded-full px-2 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onArchive()
                }}
                className="flex w-full items-center gap-2 rounded-full px-2 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
              >
                {project.archived ? (
                  <>
                    <ArchiveRestore className="h-3.5 w-3.5" />
                    Unarchive
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete()
                }}
                className="flex w-full items-center gap-2 rounded-full px-2 py-1.5 text-sm text-accent-red transition-colors hover:bg-accent-red/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
