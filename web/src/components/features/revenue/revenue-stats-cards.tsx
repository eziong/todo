import { DollarSign, TrendingUp, Handshake, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevenueStatsCardsProps {
  totalAdRevenue: number
  totalSponsorships: number
  totalRevenue: number
  paidCount: number
  pendingCount: number
  currency?: string
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
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
    <div className="rounded-[8px] border border-border bg-background-secondary p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground-secondary">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-[6px]", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-foreground-secondary">{subtitle}</p>
      )}
    </div>
  )
}

export function RevenueStatsCards({
  totalAdRevenue,
  totalSponsorships,
  totalRevenue,
  paidCount,
  pendingCount,
  currency = 'USD',
}: RevenueStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={DollarSign}
        label="Total Revenue"
        value={formatCurrency(totalRevenue, currency)}
        subtitle={`Ad + Sponsorship combined`}
        iconClassName="bg-accent-green/10 text-accent-green"
      />
      <StatCard
        icon={TrendingUp}
        label="Ad Revenue"
        value={formatCurrency(totalAdRevenue, currency)}
        subtitle="YouTube AdSense"
        iconClassName="bg-accent-blue/10 text-accent-blue"
      />
      <StatCard
        icon={Handshake}
        label="Sponsorships"
        value={formatCurrency(totalSponsorships, currency)}
        subtitle={`${paidCount} paid`}
        iconClassName="bg-accent-purple/10 text-accent-purple"
      />
      <StatCard
        icon={Clock}
        label="Pending Deals"
        value={String(pendingCount)}
        subtitle="Negotiating or confirmed"
        iconClassName="bg-accent-yellow/10 text-accent-yellow"
      />
    </div>
  )
}
