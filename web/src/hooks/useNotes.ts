import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import { fetchNotes, fetchNote, createNote, updateNote, deleteNote } from '@/services/notes'
import type { NoteId } from '@/types/branded'
import type { NoteWithFolder, NoteFilters, CreateNoteInput, UpdateNoteInput } from '@/types/domain'

export function useNotes(filters?: NoteFilters) {
  return useQuery({
    queryKey: queryKeys.notes.list(filters),
    queryFn: () => fetchNotes(filters),
  })
}

export function useNote(id: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.notes.detail(id as NoteId),
    queryFn: () => fetchNote(id),
    placeholderData: () => {
      const lists = queryClient.getQueriesData<NoteWithFolder[]>({
        queryKey: queryKeys.notes.lists(),
      })
      for (const [, data] of lists) {
        const note = data?.find((n) => (n.id as string) === id)
        if (note) return note
      }
      return undefined
    },
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: NoteId; input: UpdateNoteInput }) =>
      updateNote(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.all })

      const previousLists = queryClient.getQueriesData<NoteWithFolder[]>({
        queryKey: queryKeys.notes.lists(),
      })

      queryClient.setQueriesData<NoteWithFolder[]>(
        { queryKey: queryKeys.notes.lists() },
        (old) =>
          old?.map((note) =>
            note.id === id ? ({ ...note, ...input } as NoteWithFolder) : note,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: NoteId) => deleteNote(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.lists() })

      const previousLists = queryClient.getQueriesData<NoteWithFolder[]>({
        queryKey: queryKeys.notes.lists(),
      })

      queryClient.setQueriesData<NoteWithFolder[]>(
        { queryKey: queryKeys.notes.lists() },
        (old) => old?.filter((note) => note.id !== id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
    },
  })
}
