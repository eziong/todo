'use client'

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RevenueStatsCards } from './revenue-stats-cards'
import { RevenueChart } from './revenue-chart'
import { SponsorshipList } from './sponsorship-list'
import type {
  YouTubeMonthlyAnalytics,
  SponsorshipWithContent,
  SponsorshipStatus,
  RevenueSummary,
} from '@/types/domain'
import type { SponsorshipId } from '@/types/branded'

interface RevenueDashboardProps {
  analyticsData: YouTubeMonthlyAnalytics[]
  analyticsYear: number
  onYearChange: (year: number) => void
  sponsorships: SponsorshipWithContent[]
  summary: RevenueSummary
  isYouTubeConnected: boolean
  onAddSponsorship: () => void
  onEditSponsorship: (sponsorship: SponsorshipWithContent) => void
  onDeleteSponsorship: (id: SponsorshipId) => void
  onStatusChange: (id: SponsorshipId, status: SponsorshipStatus) => void
}

export function RevenueDashboard({
  analyticsData,
  analyticsYear,
  onYearChange,
  sponsorships,
  summary,
  isYouTubeConnected,
  onAddSponsorship,
  onEditSponsorship,
  onDeleteSponsorship,
  onStatusChange,
}: RevenueDashboardProps) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">Revenue</h1>
        <div className="flex items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onYearChange(analyticsYear - 1)}
              disabled={analyticsYear <= 2015}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[4rem] text-center text-sm font-medium text-foreground">
              {analyticsYear}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onYearChange(analyticsYear + 1)}
              disabled={analyticsYear >= currentYear}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats cards */}
        <RevenueStatsCards
          totalAdRevenue={summary.totalAdRevenue}
          totalSponsorships={summary.totalSponsorships}
          totalRevenue={summary.totalRevenue}
          paidCount={summary.paidCount}
          pendingCount={summary.pendingCount}
        />

        {/* Chart */}
        {isYouTubeConnected && (
          <RevenueChart
            analyticsData={analyticsData}
            sponsorships={sponsorships}
            year={analyticsYear}
          />
        )}

        {!isYouTubeConnected && (
          <div className="rounded-xl border border-border bg-background-secondary p-8 text-center">
            <p className="text-sm text-foreground-secondary">
              Connect your YouTube account in Settings to view ad revenue analytics.
            </p>
          </div>
        )}

        {/* Sponsorships */}
        <div className="rounded-xl border border-border bg-background-secondary p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Sponsorships</h3>
            <Button
              onClick={onAddSponsorship}
              size="sm"
              className="bg-accent-blue text-white hover:bg-accent-blue/90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Sponsorship
            </Button>
          </div>
          <SponsorshipList
            sponsorships={sponsorships}
            onEdit={onEditSponsorship}
            onDelete={onDeleteSponsorship}
            onStatusChange={onStatusChange}
          />
        </div>
      </div>
    </div>
  )
}
