'use client'

import { useRef, useState } from 'react'
import { CheckSquare, Plus } from 'lucide-react'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'

interface TaskEmptyStateProps {
  onCreateTask: (title: string) => void
  isCreating?: boolean
}

export function TaskEmptyState({ onCreateTask, isCreating }: TaskEmptyStateProps) {
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    const title = inputValue.trim()
    if (!title) return
    onCreateTask(title)
    setInputValue('')
  }

  const handleShowInput = () => {
    setShowInput(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">All Tasks</h1>
      </div>

      <Empty className="py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckSquare />
          </EmptyMedia>
          <EmptyTitle>No tasks yet</EmptyTitle>
          <EmptyDescription>
            Create your first task to start organizing your work.
          </EmptyDescription>
        </EmptyHeader>
        {showInput ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSubmit()
              if (e.key === 'Escape') {
                setShowInput(false)
                setInputValue('')
              }
            }}
            placeholder="Task name..."
            disabled={isCreating}
            className="w-full max-w-xs rounded-xl border border-border bg-background-secondary px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/60 transition-colors focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue disabled:opacity-50"
          />
        ) : (
          <button
            onClick={handleShowInput}
            className="flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>
        )}
      </Empty>
    </div>
  )
}
