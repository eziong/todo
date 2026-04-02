import { Skeleton } from '@/components/ui/skeleton'

export function InboxSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Quick add */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Items */}
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b border-border px-2 py-3"
          >
            <Skeleton className="mt-0.5 h-4 w-4" />
            <Skeleton className="mt-0.5 h-5 w-5 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Processed section */}
      <div className="pt-2">
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  )
}
