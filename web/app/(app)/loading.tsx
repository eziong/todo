import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div className="space-y-6">
      {/* Page header placeholder */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* Content area placeholder */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2.5">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1 max-w-[300px]" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
