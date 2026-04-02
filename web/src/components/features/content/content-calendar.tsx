"use client"

import { useState } from "react"
import { DayPicker } from "react-day-picker"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { STAGE_LABELS, TYPE_COLORS, PLATFORM_COLORS } from "./content-card"
import type { ContentWithDetails } from "@/types/domain"

interface ContentCalendarProps {
  contents: ContentWithDetails[]
  onSelectDate: (date: Date | undefined) => void
  onSelectContent: (id: string) => void
  selectedDate: Date | undefined
}

export function ContentCalendar({
  contents,
  onSelectDate,
  onSelectContent,
  selectedDate,
}: ContentCalendarProps) {
  const [month, setMonth] = useState(new Date())

  // Group scheduled contents by date string (YYYY-MM-DD)
  const contentsByDate = new Map<string, ContentWithDetails[]>()
  for (const content of contents) {
    if (content.scheduledAt) {
      const dateKey = content.scheduledAt.slice(0, 10)
      const existing = contentsByDate.get(dateKey) ?? []
      existing.push(content)
      contentsByDate.set(dateKey, existing)
    }
  }

  const scheduledDates = Array.from(contentsByDate.keys()).map((d) => new Date(d))

  const selectedDateKey = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : null
  const selectedContents = selectedDateKey ? contentsByDate.get(selectedDateKey) ?? [] : []

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">Content Calendar</h1>
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          <Calendar className="h-4 w-4" />
          <span>{contents.filter((c) => c.scheduledAt).length} scheduled</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Calendar */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-lg">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={onSelectDate}
              month={month}
              onMonthChange={setMonth}
              showOutsideDays
              modifiers={{
                scheduled: scheduledDates,
              }}
              modifiersClassNames={{
                scheduled: 'rdp-day-scheduled',
              }}
              classNames={{
                root: 'w-full',
                months: 'w-full',
                month: 'w-full',
                caption: 'flex items-center justify-between mb-4',
                caption_label: 'text-sm font-medium text-foreground',
                nav: 'flex items-center gap-1',
                nav_button: 'h-7 w-7 rounded-lg flex items-center justify-center text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors',
                table: 'w-full border-collapse',
                head_row: '',
                head_cell: 'w-10 pb-2 text-center text-xs font-medium text-foreground-secondary',
                row: '',
                cell: 'relative p-0 text-center',
                day: cn(
                  'h-10 w-10 mx-auto rounded-lg text-sm transition-colors',
                  'text-foreground hover:bg-background-tertiary',
                  'aria-selected:bg-accent-blue aria-selected:text-white',
                ),
                day_today: 'font-bold text-accent-blue',
                day_outside: 'text-foreground-secondary/30',
                day_disabled: 'text-foreground-secondary/20',
              }}
              components={{
                PreviousMonthButton: ({ ...props }) => (
                  <button {...props}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ),
                NextMonthButton: ({ ...props }) => (
                  <button {...props}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ),
                DayButton: ({ day, ...props }) => {
                  const dateKey = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`
                  const hasContent = contentsByDate.has(dateKey)
                  return (
                    <button {...props} className={cn(props.className, 'relative')}>
                      {day.date.getDate()}
                      {hasContent && (
                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent-blue" />
                      )}
                    </button>
                  )
                },
              }}
            />
          </div>
        </div>

        {/* Selected date contents */}
        <div className="w-80 shrink-0 border-l border-border overflow-auto">
          <div className="p-4">
            {selectedDate ? (
              <>
                <h2 className="text-sm font-medium text-foreground mb-3">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
                {selectedContents.length === 0 ? (
                  <p className="text-sm text-foreground-secondary">No content scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedContents.map((content) => (
                      <button
                        key={content.id}
                        onClick={() => onSelectContent(content.id as string)}
                        className="w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-foreground-secondary/30"
                      >
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {content.title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", TYPE_COLORS[content.type])}>
                            {content.type}
                          </span>
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", PLATFORM_COLORS[content.platform])}>
                            {content.platform}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-foreground-secondary">
                          <span>{STAGE_LABELS[content.stage]}</span>
                          {content.projectName && (
                            <>
                              <span className="text-foreground-secondary/30">|</span>
                              <span>{content.projectName}</span>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-foreground-secondary">Select a date to see scheduled content.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
