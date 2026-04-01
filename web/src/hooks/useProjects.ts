import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import { fetchProjects, createProject, updateProject, deleteProject } from '@/services/projects'
import type { ProjectId } from '@/types/branded'
import type { ProjectWithStats, CreateProjectInput, UpdateProjectInput } from '@/types/domain'

export function useProjects(archived?: boolean) {
  return useQuery({
    queryKey: queryKeys.projects.list(archived),
    queryFn: () => fetchProjects(archived),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: ProjectId; input: UpdateProjectInput }) =>
      updateProject(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.all })

      const previousLists = queryClient.getQueriesData<ProjectWithStats[]>({
        queryKey: queryKeys.projects.lists(),
      })

      queryClient.setQueriesData<ProjectWithStats[]>(
        { queryKey: queryKeys.projects.lists() },
        (old) =>
          old?.map((project) =>
            project.id === id
              ? ({ ...project, ...input } as ProjectWithStats)
              : project,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: ProjectId) => deleteProject(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.lists() })

      const previousLists = queryClient.getQueriesData<ProjectWithStats[]>({
        queryKey: queryKeys.projects.lists(),
      })

      queryClient.setQueriesData<ProjectWithStats[]>(
        { queryKey: queryKeys.projects.lists() },
        (old) => old?.filter((project) => project.id !== id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      // Also invalidate todos since project deletion sets project_id to null
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all })
    },
  })
}
