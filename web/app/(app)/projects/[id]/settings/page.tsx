'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectId } from '@/types/branded'
import { useProject } from '@/hooks/useProject'
import { useUpdateProject, useDeleteProject } from '@/hooks/useProjects'
import { ProjectFormDialog } from '@/components/features/projects/project-form-dialog'
import { ProjectIntegrations } from '@/components/features/projects/project-integrations'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ProjectFeature, UpdateProjectInput } from '@/types/domain'

const ALL_FEATURES: { value: ProjectFeature; label: string; description: string }[] = [
  { value: 'tasks', label: 'Tasks', description: 'Task management and to-do lists' },
  { value: 'builds', label: 'Builds', description: 'Build commands and deployment history' },
  { value: 'content', label: 'Content', description: 'Content pipeline and publishing' },

  { value: 'assets', label: 'Assets', description: 'File and image management' },
  { value: 'youtube', label: 'YouTube', description: 'YouTube channel integration' },
  { value: 'revenue', label: 'Revenue', description: 'Ad revenue and sponsorships' },
  { value: 'notes', label: 'Notes', description: 'Project notes and documentation' },
  { value: 'links', label: 'Links', description: 'Bookmarks and reference links' },
]

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const projectId = ProjectId(params.id)

  const { data: project } = useProject(projectId)
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (!project) return null

  const handleFeatureToggle = (feature: ProjectFeature) => {
    const current = project.features
    const updated = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature]

    updateProject.mutate(
      { id: projectId, input: { features: updated } },
      {
        onSuccess: () => {
          toast.success('Features updated')
        },
      }
    )
  }

  const handleEditSubmit = (input: UpdateProjectInput) => {
    updateProject.mutate(
      { id: projectId, input },
      {
        onSuccess: () => {
          toast.success('Project updated')
        },
      }
    )
  }

  const handleArchive = () => {
    updateProject.mutate(
      { id: projectId, input: { archived: !project.archived } },
      {
        onSuccess: () => {
          toast.success(project.archived ? 'Project unarchived' : 'Project archived')
          if (!project.archived) {
            router.push('/projects')
          }
        },
      }
    )
  }

  const handleDelete = () => {
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        toast.success('Project deleted')
        router.push('/projects')
      },
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Project Info */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">General</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="text-foreground-secondary"
          >
            Edit Project
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-background-secondary p-4 space-y-3">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-foreground-secondary">Name</span>
            <p className="mt-0.5 text-sm text-foreground">{project.name}</p>
          </div>
          {project.description && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-foreground-secondary">Description</span>
              <p className="mt-0.5 text-sm text-foreground">{project.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Features</h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            Toggle features to show or hide tabs in this project.
          </p>
        </div>
        <div className="space-y-2">
          {ALL_FEATURES.map((f) => (
            <label
              key={f.value}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors',
                project.features.includes(f.value)
                  ? 'border-accent-blue/30 bg-accent-blue/5'
                  : 'border-border hover:border-foreground-secondary/30'
              )}
            >
              <Checkbox
                checked={project.features.includes(f.value)}
                onCheckedChange={() => handleFeatureToggle(f.value)}
                className="mt-0.5 border-foreground-secondary/40 data-[state=checked]:bg-accent-blue data-[state=checked]:border-accent-blue"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="text-xs text-foreground-secondary">{f.description}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <ProjectIntegrations projectId={params.id} />

      {/* Danger Zone */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
        <div className="rounded-xl border border-accent-red/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {project.archived ? 'Unarchive project' : 'Archive project'}
              </p>
              <p className="text-xs text-foreground-secondary">
                {project.archived
                  ? 'Restore this project to the active list.'
                  : 'Hide this project from the sidebar. You can unarchive it later.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={updateProject.isPending}
              className="gap-1.5 text-foreground-secondary"
            >
              <Archive className="h-3.5 w-3.5" />
              {project.archived ? 'Unarchive' : 'Archive'}
            </Button>
          </div>
          <div className="border-t border-accent-red/10" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-accent-red">Delete project</p>
              <p className="text-xs text-foreground-secondary">
                Permanently delete this project and all associated data.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-1.5 border-accent-red/30 text-accent-red hover:bg-accent-red/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </section>

      {/* Edit Dialog */}
      <ProjectFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={project}
        onSubmit={handleEditSubmit}
        isPending={updateProject.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-background-secondary">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground-secondary">
              Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone and will permanently delete all associated tasks, builds, content, and other data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-accent-red text-white hover:bg-accent-red/90"
            >
              {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
