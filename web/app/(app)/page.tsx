'use client'

import { useDashboard } from '@/hooks/useDashboard'
import { DashboardContent } from '@/components/features/dashboard/dashboard-content'
import { DashboardSkeleton } from '@/components/features/dashboard/dashboard-skeleton'
import { classifyError } from '@/lib/errors'

export default function DashboardPage() {
  const dashboard = useDashboard()

  if (dashboard.isLoading) return <DashboardSkeleton />

  if (dashboard.error && !dashboard.todaysTasks.length) {
    const classified = classifyError(dashboard.error)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-foreground">{classified.title}</p>
        <p className="text-sm text-foreground-secondary">{classified.message}</p>
        {classified.retryable && (
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  return (
    <DashboardContent
      greeting={dashboard.greeting}
      dateStr={dashboard.dateStr}
      todaysTasks={dashboard.todaysTasks}
      inboxItems={dashboard.inboxItems}
      inboxUnprocessedCount={dashboard.inboxUnprocessedCount}
      upcoming={dashboard.upcoming}
      projects={dashboard.projects}
      recentActivity={dashboard.recentActivity}
    />
  )
}
