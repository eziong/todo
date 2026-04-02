'use client'

import { ChevronLeft, ChevronRight, DollarSign, Handshake, Clock, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GlobalRevenueSummary } from '@/services/revenue'

interface GlobalRevenueDashboardProps {
  summary: GlobalRevenueSummary
  year: number
  onYearChange: (year: number) => void
  isLoading: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string
  subtitle?: string
  iconClassName?: string
}

function StatCard({ icon: Icon, label, value, subtitle, iconClassName }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-background-secondary p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground-secondary">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-foreground-secondary">{subtitle}</p>
      )}
    </div>
  )
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function MonthlyChart({ data }: { data: Array<{ month: string; amount: number }> }) {
  const monthMap = new Map(data.map((d) => [d.month, d.amount]))
  const year = data[0]?.month?.slice(0, 4) ?? String(new Date().getFullYear())

  const months = MONTH_LABELS.map((label, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`
    return { label, amount: monthMap.get(key) ?? 0 }
  })

  const maxAmount = Math.max(...months.map((m) => m.amount), 1)

  return (
    <div className="rounded-xl border border-border bg-background-secondary p-4">
      <h3 className="mb-4 text-sm font-medium text-foreground">Monthly Paid Revenue</h3>
      <div className="flex items-end gap-2" style={{ height: 160 }}>
        {months.map((m) => (
          <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "w-full rounded-t-[4px] transition-all",
                m.amount > 0 ? "bg-accent-green" : "bg-background-tertiary",
              )}
              style={{ height: Math.max(4, (m.amount / maxAmount) * 140) }}
              title={formatCurrency(m.amount)}
            />
            <span className="text-[10px] text-foreground-secondary">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GlobalRevenueDashboard({
  summary,
  year,
  onYearChange,
  isLoading,
}: GlobalRevenueDashboardProps) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">Revenue</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onYearChange(year - 1)}
            disabled={year <= 2015}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[4rem] text-center text-sm font-medium text-foreground">
            {year}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onYearChange(year + 1)}
            disabled={year >= currentYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-xl bg-background-secondary" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={formatCurrency(summary.totalAmount)}
                subtitle="All sponsorships"
                iconClassName="bg-accent-green/10 text-accent-green"
              />
              <StatCard
                icon={Handshake}
                label="Paid"
                value={formatCurrency(summary.paidAmount)}
                subtitle={`${summary.paidCount} deals`}
                iconClassName="bg-accent-blue/10 text-accent-blue"
              />
              <StatCard
                icon={Clock}
                label="Pending"
                value={formatCurrency(summary.pendingAmount)}
                subtitle={`${summary.pendingCount} deals`}
                iconClassName="bg-accent-yellow/10 text-accent-yellow"
              />
              <StatCard
                icon={FileCheck}
                label="Invoiced"
                value={String(summary.invoicedCount)}
                subtitle="Awaiting payment"
                iconClassName="bg-accent-purple/10 text-accent-purple"
              />
            </div>

            {/* Monthly chart */}
            {summary.monthlyBreakdown.length > 0 ? (
              <MonthlyChart data={summary.monthlyBreakdown} />
            ) : (
              <div className="rounded-xl border border-border bg-background-secondary p-8 text-center">
                <p className="text-sm text-foreground-secondary">
                  No paid sponsorship revenue recorded for {year}.
                </p>
              </div>
            )}

            {/* Info */}
            <div className="rounded-xl border border-border bg-background-secondary p-4">
              <p className="text-sm text-foreground-secondary">
                This dashboard shows aggregated revenue across all projects.
                For per-project details including YouTube analytics and individual sponsorship management,
                visit each project&apos;s Revenue tab.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
