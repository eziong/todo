import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { fetchProject } from '@/services/projects'
import type { ProjectId } from '@/types/branded'
import type { ProjectWithStats } from '@/types/domain'

export function useProject(id: ProjectId) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => fetchProject(id),
    placeholderData: () => {
      const lists = queryClient.getQueriesData<ProjectWithStats[]>({
        queryKey: queryKeys.projects.lists(),
      })
      for (const [, data] of lists) {
        const project = data?.find((p) => p.id === id)
        if (project) return project
      }
      return undefined
    },
  })
}
