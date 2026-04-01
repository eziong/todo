import { Skeleton } from '@/components/ui/skeleton'

export function TasksSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-[6px]" />
          <Skeleton className="h-8 w-16 rounded-[6px]" />
        </div>
      </div>

      {/* Quick add input */}
      <Skeleton className="h-12 w-full rounded-[8px]" />

      {/* Task sections */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-1 border-t border-border pt-3">
          <div className="flex items-center gap-2 py-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-6" />
          </div>
          {Array.from({ length: section === 1 ? 3 : 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2.5">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-5 w-5 rounded-[4px]" />
              <Skeleton className="h-4 flex-1 max-w-[200px]" />
              <Skeleton className="h-5 w-14 rounded-[4px]" />
            </div>
          ))}
        </div>
      ))}

      {/* No date section */}
      <div className="border-t border-border pt-3">
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Completed section */}
      <div className="border-t border-border pt-3">
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  )
}
