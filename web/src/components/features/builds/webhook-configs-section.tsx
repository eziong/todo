"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Webhook } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { WebhookConfigDialog } from "./webhook-config-dialog"
import {
  useBuildCommands,
  useCreateBuildCommand,
  useUpdateBuildCommand,
  useDeleteBuildCommand,
} from "@/hooks/useBuildCommands"
import type { BuildCommand, CreateBuildCommandInput, UpdateBuildCommandInput } from "@/types/domain"

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-accent-green/10 text-accent-green",
  POST: "bg-accent-blue/10 text-accent-blue",
  PUT: "bg-accent-yellow/10 text-accent-yellow",
  PATCH: "bg-accent-purple/10 text-accent-purple",
  DELETE: "bg-accent-red/10 text-accent-red",
}

interface WebhookConfigsSectionProps {
  projectId: string
}

export function WebhookConfigsSection({ projectId }: WebhookConfigsSectionProps) {
  const { data: configs } = useBuildCommands(projectId)
  const createConfig = useCreateBuildCommand(projectId)
  const updateConfig = useUpdateBuildCommand()
  const deleteConfig = useDeleteBuildCommand()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<BuildCommand | null>(null)
  const [deletingConfig, setDeletingConfig] = useState<BuildCommand | null>(null)

  const handleCreate = () => {
    setEditingConfig(null)
    setDialogOpen(true)
  }

  const handleEdit = (config: BuildCommand) => {
    setEditingConfig(config)
    setDialogOpen(true)
  }

  const handleSave = (input: CreateBuildCommandInput | UpdateBuildCommandInput) => {
    if (editingConfig) {
      updateConfig.mutate(
        { id: editingConfig.id, input: input as UpdateBuildCommandInput },
        {
          onSuccess: () => {
            toast.success("Webhook updated")
            setDialogOpen(false)
          },
        }
      )
    } else {
      createConfig.mutate(input as CreateBuildCommandInput, {
        onSuccess: () => {
          toast.success("Webhook created")
          setDialogOpen(false)
        },
      })
    }
  }

  const handleDelete = () => {
    if (!deletingConfig) return
    deleteConfig.mutate(deletingConfig.id, {
      onSuccess: () => {
        toast.success("Webhook deleted")
        setDeletingConfig(null)
      },
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Webhooks</h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            Configure webhook endpoints to trigger builds via HTTP requests.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreate}
          className="gap-1.5 text-foreground-secondary"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Webhook
        </Button>
      </div>

      {configs && configs.length > 0 ? (
        <div className="space-y-2">
          {configs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between rounded-[8px] border border-border bg-background-secondary p-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span
                  className={cn(
                    "shrink-0 rounded-[4px] px-2 py-0.5 text-xs font-semibold",
                    METHOD_COLORS[config.method] ?? "bg-foreground-secondary/10 text-foreground-secondary"
                  )}
                >
                  {config.method}
                </span>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-foreground">
                    {config.label}
                  </p>
                  <p className="truncate text-xs font-mono text-foreground-secondary">
                    {config.url}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 ml-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(config)}
                  className="h-8 w-8 p-0 text-foreground-secondary hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingConfig(config)}
                  className="h-8 w-8 p-0 text-foreground-secondary hover:text-accent-red"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-border py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background-tertiary">
            <Webhook className="h-5 w-5 text-foreground-secondary" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">No webhooks configured</p>
          <p className="mt-1 text-xs text-foreground-secondary">
            Add a webhook to trigger builds from external CI/CD systems.
          </p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <WebhookConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingConfig={editingConfig}
        onSave={handleSave}
        isPending={createConfig.isPending || updateConfig.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={Boolean(deletingConfig)}
        onOpenChange={(open) => { if (!open) setDeletingConfig(null) }}
      >
        <AlertDialogContent className="border-border bg-background-secondary">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground-secondary">
              Are you sure you want to delete <strong>{deletingConfig?.label}</strong>?
              Existing builds linked to this webhook will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-accent-red text-white hover:bg-accent-red/90"
            >
              {deleteConfig.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
