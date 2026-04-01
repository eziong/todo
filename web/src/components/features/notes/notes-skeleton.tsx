import { Skeleton } from '@/components/ui/skeleton'

export function NotesSkeleton() {
  return (
    <div className="flex h-full">
      {/* Folder sidebar skeleton */}
      <div className="w-56 shrink-0 border-r border-border p-4 space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-[6px]" />
          ))}
        </div>
      </div>

      {/* Notes list skeleton */}
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-9 w-28 rounded-[6px]" />
        </div>

        {/* Search */}
        <Skeleton className="h-9 w-full max-w-sm rounded-[6px]" />

        {/* Note cards */}
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[8px] border border-border bg-background-secondary p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-5 w-16 rounded-[4px]" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
