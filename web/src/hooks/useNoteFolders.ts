import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import {
  fetchNoteFolders,
  createNoteFolder,
  updateNoteFolder,
  deleteNoteFolder,
} from '@/services/notes'
import type { NoteFolderId } from '@/types/branded'
import type { NoteFolder, CreateNoteFolderInput, UpdateNoteFolderInput } from '@/types/domain'

export function useNoteFolders() {
  return useQuery({
    queryKey: queryKeys.noteFolders.lists(),
    queryFn: fetchNoteFolders,
  })
}

export function useCreateNoteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateNoteFolderInput) => createNoteFolder(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.noteFolders.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateNoteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: NoteFolderId; input: UpdateNoteFolderInput }) =>
      updateNoteFolder(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.noteFolders.all })

      const previousLists = queryClient.getQueriesData<NoteFolder[]>({
        queryKey: queryKeys.noteFolders.lists(),
      })

      queryClient.setQueriesData<NoteFolder[]>(
        { queryKey: queryKeys.noteFolders.lists() },
        (old) =>
          old?.map((folder) =>
            folder.id === id ? ({ ...folder, ...input } as NoteFolder) : folder,
          ),
      )

      return { previousLists }
    },
    onError: (error, _vars, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data)
        }
      }
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.noteFolders.all })
    },
  })
}

export function useDeleteNoteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: NoteFolderId) => deleteNoteFolder(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.noteFolders.lists() })

      const previousLists = queryClient.getQueriesData<NoteFolder[]>({
        queryKey: queryKeys.noteFolders.lists(),
      })

      queryClient.setQueriesData<NoteFolder[]>(
        { queryKey: queryKeys.noteFolders.lists() },
        (old) => old?.filter((folder) => folder.id !== id),
      )

      return { previousLists }
    },
    onError: (error, _id, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data)
        }
      }
      handleMutationError(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.noteFolders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
    },
  })
}
