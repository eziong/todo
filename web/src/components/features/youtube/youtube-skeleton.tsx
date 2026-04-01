import { Skeleton } from '@/components/ui/skeleton'

export function YouTubeSkeleton() {
  return (
    <div className="space-y-6">
      {/* Channel Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[8px] border border-border bg-background-secondary p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>

      {/* Recent Videos */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-[8px]" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
