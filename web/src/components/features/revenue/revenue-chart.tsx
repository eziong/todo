'use client'

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { YouTubeMonthlyAnalytics, SponsorshipWithContent } from '@/types/domain'

interface RevenueChartProps {
  analyticsData: YouTubeMonthlyAnalytics[]
  sponsorships: SponsorshipWithContent[]
  year: number
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const chartConfig = {
  adRevenue: {
    label: 'Ad Revenue',
    color: '#4C9EEB',
  },
  sponsorshipRevenue: {
    label: 'Sponsorship',
    color: '#45B36B',
  },
} satisfies ChartConfig

function buildChartData(
  analyticsData: YouTubeMonthlyAnalytics[],
  sponsorships: SponsorshipWithContent[],
  year: number
) {
  const paidSponsorships = sponsorships.filter(
    (s) => s.status === 'paid' || s.status === 'delivered'
  )

  return MONTH_LABELS.map((label, i) => {
    const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`
    const analytics = analyticsData.find((a) => a.month === monthStr)

    const sponsorshipTotal = paidSponsorships
      .filter((s) => s.paidAt && s.paidAt.startsWith(monthStr))
      .reduce((sum, s) => sum + s.amount, 0)

    return {
      month: label,
      adRevenue: analytics?.estimatedRevenue ?? 0,
      sponsorshipRevenue: sponsorshipTotal,
    }
  })
}

export function RevenueChart({ analyticsData, sponsorships, year }: RevenueChartProps) {
  const chartData = buildChartData(analyticsData, sponsorships, year)

  return (
    <div className="rounded-xl border border-border bg-background-secondary p-4">
      <h3 className="mb-4 text-sm font-medium text-foreground">Monthly Revenue ({year})</h3>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="adRevenue"
            fill="var(--color-adRevenue)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="sponsorshipRevenue"
            fill="var(--color-sponsorshipRevenue)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
