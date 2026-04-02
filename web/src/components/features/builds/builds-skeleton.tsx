import { Skeleton } from '@/components/ui/skeleton'

export function BuildsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-20" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-16" />
      </div>

      {/* Build cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-background-secondary border-l-4 border-l-foreground-secondary/20"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
