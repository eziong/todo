import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { performUndo, performRedo } from '@/services/undo'
import { handleMutationError } from '@/lib/errors'
import { queryKeys } from '@/lib/queryKeys'

// Map server table names to query key prefixes for cache invalidation
const TABLE_QUERY_MAP: Record<string, readonly string[]> = {
  todos: queryKeys.todos.all,
  projects: queryKeys.projects.all,
  notes: queryKeys.notes.all,
  contents: queryKeys.contents.all,
  links: queryKeys.links.all,
  tags: queryKeys.tags.all,
  inbox_items: queryKeys.inbox.all,
  builds: queryKeys.builds.all,
  build_commands: queryKeys.buildCommands.all,
  sponsorships: queryKeys.sponsorships.all,
  assets: queryKeys.assets.all,
  notifications: queryKeys.notifications.all,
}

export function useUndo() {
  const queryClient = useQueryClient()

  const undoMutation = useMutation({
    mutationFn: performUndo,
    onSuccess: (result) => {
      if (result.undone) {
        const queryKey = TABLE_QUERY_MAP[result.undone.tableName]
        if (queryKey) {
          queryClient.invalidateQueries({ queryKey })
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.activity.all })
        toast.success('Undone', {
          description: `${result.undone.action} on ${result.undone.tableName}`,
        })
      } else if (result.message) {
        toast.info(result.message)
      }
    },
    onError: handleMutationError,
  })

  const redoMutation = useMutation({
    mutationFn: performRedo,
    onSuccess: (result) => {
      if (result.redone) {
        const queryKey = TABLE_QUERY_MAP[result.redone.tableName]
        if (queryKey) {
          queryClient.invalidateQueries({ queryKey })
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.activity.all })
        toast.success('Redone', {
          description: `${result.redone.action} on ${result.redone.tableName}`,
        })
      } else if (result.message) {
        toast.info(result.message)
      }
    },
    onError: handleMutationError,
  })

  return {
    undo: undoMutation.mutate,
    redo: redoMutation.mutate,
    isUndoing: undoMutation.isPending,
    isRedoing: redoMutation.isPending,
    undoResult: undoMutation.data,
    redoResult: redoMutation.data,
  }
}
