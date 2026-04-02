import { Skeleton } from '@/components/ui/skeleton'

export function LinksSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Category filter */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>

      {/* Link cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-border bg-background-secondary p-4"
          >
            <div className="space-y-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
