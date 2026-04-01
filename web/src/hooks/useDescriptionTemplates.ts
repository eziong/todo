import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import {
  fetchDescriptionTemplates,
  createDescriptionTemplate,
  updateDescriptionTemplate,
  deleteDescriptionTemplate,
} from '@/services/links'
import type { DescriptionTemplateId } from '@/types/branded'
import type {
  DescriptionTemplate,
  CreateDescriptionTemplateInput,
  UpdateDescriptionTemplateInput,
} from '@/types/domain'

export function useDescriptionTemplates() {
  return useQuery({
    queryKey: queryKeys.descriptionTemplates.lists(),
    queryFn: fetchDescriptionTemplates,
  })
}

export function useCreateDescriptionTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDescriptionTemplateInput) => createDescriptionTemplate(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.descriptionTemplates.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateDescriptionTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: DescriptionTemplateId; input: UpdateDescriptionTemplateInput }) =>
      updateDescriptionTemplate(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.descriptionTemplates.all })

      const previousLists = queryClient.getQueriesData<DescriptionTemplate[]>({
        queryKey: queryKeys.descriptionTemplates.lists(),
      })

      queryClient.setQueriesData<DescriptionTemplate[]>(
        { queryKey: queryKeys.descriptionTemplates.lists() },
        (old) =>
          old?.map((template) =>
            template.id === id ? ({ ...template, ...input } as DescriptionTemplate) : template,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.descriptionTemplates.all })
    },
  })
}

export function useDeleteDescriptionTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: DescriptionTemplateId) => deleteDescriptionTemplate(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.descriptionTemplates.lists() })

      const previousLists = queryClient.getQueriesData<DescriptionTemplate[]>({
        queryKey: queryKeys.descriptionTemplates.lists(),
      })

      queryClient.setQueriesData<DescriptionTemplate[]>(
        { queryKey: queryKeys.descriptionTemplates.lists() },
        (old) => old?.filter((template) => template.id !== id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.descriptionTemplates.all })
    },
  })
}
