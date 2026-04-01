import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { fetchYouTubeAnalytics, fetchGlobalRevenueSummary } from '@/services/revenue'

export function useYouTubeAnalytics(projectId: string, year?: number) {
  return useQuery({
    queryKey: queryKeys.revenue.analytics(projectId, year),
    queryFn: () => fetchYouTubeAnalytics(projectId, year!),
    enabled: Boolean(projectId) && year !== undefined,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useGlobalRevenueSummary(year: number) {
  return useQuery({
    queryKey: [...queryKeys.revenue.all, 'globalSummary', year] as const,
    queryFn: () => fetchGlobalRevenueSummary(year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
