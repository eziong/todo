'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useContents } from '@/hooks/useContents'
import { ContentCalendar } from '@/components/features/content/content-calendar'
import { ContentSkeleton } from '@/components/features/content/content-skeleton'
import { classifyError } from '@/lib/errors'

export default function CalendarPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const { data: contents, isLoading, error, refetch } = useContents()

  if (isLoading) return <ContentSkeleton />

  if (error && !contents) {
    const classified = classifyError(error)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-foreground">{classified.title}</p>
        <p className="text-sm text-foreground-secondary">{classified.message}</p>
        {classified.retryable && (
          <button
            onClick={() => refetch()}
            className="rounded-[6px] bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  return (
    <ContentCalendar
      contents={contents ?? []}
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
      onSelectContent={(id) => router.push(`/content/${id}`)}
    />
  )
}
