import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Today's Focus */}
      <section className="rounded-lg border border-border bg-background-secondary p-4">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Two-column grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Inbox */}
        <section className="rounded-lg border border-border bg-background-secondary p-4">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex flex-col gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </section>

        {/* Upcoming */}
        <section className="rounded-lg border border-border bg-background-secondary p-4">
          <Skeleton className="mb-3 h-5 w-24" />
          <Skeleton className="mb-1.5 h-3 w-20" />
          <div className="flex flex-col gap-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </section>
      </div>

      {/* Projects */}
      <section>
        <Skeleton className="mb-3 h-5 w-20" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="rounded-lg border border-border bg-background-secondary p-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
