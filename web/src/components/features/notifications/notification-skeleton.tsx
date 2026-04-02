import { Skeleton } from '@/components/ui/skeleton'

export function NotificationSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 px-6 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* List items */}
      <div className="flex-1 px-6 space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
