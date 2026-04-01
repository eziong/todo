import { apiGet } from '@/lib/api-client'
import type { YouTubeMonthlyAnalytics } from '@/types/domain'

interface YouTubeAnalyticsResponse {
  year: number
  analytics: YouTubeMonthlyAnalytics[]
}

export interface GlobalRevenueSummary {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  paidCount: number
  pendingCount: number
  invoicedCount: number
  monthlyBreakdown: Array<{ month: string; amount: number }>
}

export async function fetchYouTubeAnalytics(projectId: string, year: number): Promise<YouTubeAnalyticsResponse> {
  try {
    return await apiGet<YouTubeAnalyticsResponse>(`/api/projects/${projectId}/youtube/analytics?year=${year}`)
  } catch {
    return { year, analytics: [] }
  }
}

export async function fetchGlobalRevenueSummary(year: number): Promise<GlobalRevenueSummary> {
  return apiGet<GlobalRevenueSummary>(`/api/sponsorships/summary?year=${year}`)
}
