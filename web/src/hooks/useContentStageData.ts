import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import { upsertContentStageData } from '@/services/contents'
import type { ContentId } from '@/types/branded'
import type {
  ContentStage,
  ContentStageData,
  ContentWithDetails,
  UpsertStageDataInput,
} from '@/types/domain'

export function useUpsertContentStageData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      contentId,
      stage,
      input,
    }: {
      contentId: ContentId
      stage: ContentStage
      input: UpsertStageDataInput
    }) => upsertContentStageData(contentId as string, stage, input),
    onMutate: async ({ contentId, stage, input }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.contents.detail(contentId),
      })

      const previousContent = queryClient.getQueryData<ContentWithDetails>(
        queryKeys.contents.detail(contentId),
      )

      queryClient.setQueryData<ContentWithDetails>(
        queryKeys.contents.detail(contentId),
        (old) => {
          if (!old) return old
          const existingIdx = old.stageData.findIndex((sd) => sd.stage === stage)
          const updatedStageData = [...old.stageData]
          if (existingIdx >= 0) {
            updatedStageData[existingIdx] = {
              ...updatedStageData[existingIdx],
              description: input.description ?? null,
            }
          } else {
            updatedStageData.push({
              id: `temp-${Date.now()}` as ContentStageData['id'],
              contentId,
              stage,
              description: input.description ?? null,
              completedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }
          return { ...old, stageData: updatedStageData }
        },
      )

      return { previousContent }
    },
    onError: (error, { contentId }, context) => {
      if (context?.previousContent) {
        queryClient.setQueryData(
          queryKeys.contents.detail(contentId),
          context.previousContent,
        )
      }
      handleMutationError(error)
    },
    onSettled: (_data, _error, { contentId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contents.detail(contentId),
      })
    },
  })
}
