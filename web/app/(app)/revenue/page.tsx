'use client'

import { useState } from 'react'
import { useGlobalRevenueSummary } from '@/hooks/useRevenue'
import { GlobalRevenueDashboard } from '@/components/features/revenue/global-revenue-dashboard'
import { classifyError } from '@/lib/errors'

export default function RevenuePage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data: summary, isLoading, error, refetch } = useGlobalRevenueSummary(year)

  if (error && !summary) {
    const classified = classifyError(error)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-foreground">{classified.title}</p>
        <p className="text-sm text-foreground-secondary">{classified.message}</p>
        {classified.retryable && (
          <button
            onClick={() => refetch()}
            className="rounded-[6px] bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  const defaultSummary = {
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    invoicedCount: 0,
    monthlyBreakdown: [],
  }

  return (
    <GlobalRevenueDashboard
      summary={summary ?? defaultSummary}
      year={year}
      onYearChange={setYear}
      isLoading={isLoading}
    />
  )
}
