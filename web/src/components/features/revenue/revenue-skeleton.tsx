import { Skeleton } from '@/components/ui/skeleton'

export function RevenueSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <Skeleton className="h-7 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 px-6 pt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-background-secondary p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="px-6 pt-6">
        <div className="rounded-xl border border-border bg-background-secondary p-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>

      {/* Sponsorship list */}
      <div className="px-6 pt-6 pb-6">
        <div className="rounded-xl border border-border bg-background-secondary p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
