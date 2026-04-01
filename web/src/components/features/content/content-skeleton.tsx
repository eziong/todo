import { Skeleton } from '@/components/ui/skeleton'

export function ContentSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <Skeleton className="h-7 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-[6px]" />
          <Skeleton className="h-9 w-24 rounded-[6px]" />
          <Skeleton className="h-9 w-32 rounded-[6px]" />
        </div>
      </div>

      {/* Pipeline columns */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4" style={{ minWidth: '1620px' }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="w-[180px] shrink-0 rounded-[8px] border border-border bg-background-secondary p-3 space-y-3"
            >
              {/* Column header */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>

              {/* Cards */}
              {Array.from({ length: i < 3 ? 2 : 1 }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-[6px] border border-border bg-background p-3 space-y-2"
                >
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-12 rounded-[4px]" />
                    <Skeleton className="h-4 w-14 rounded-[4px]" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
