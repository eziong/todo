'use client'

import { useInbox, useCreateInboxItem, useProcessInboxItem, useDeleteInboxItem } from '@/hooks/useInbox'
import { InboxContent } from '@/components/features/inbox/inbox-content'
import { InboxSkeleton } from '@/components/features/inbox/inbox-skeleton'
import { classifyError } from '@/lib/errors'
import type { InboxItemId } from '@/types/branded'
import type { CreateInboxItemInput, ProcessInboxItemInput } from '@/types/domain'

export default function InboxPage() {
  const { data: items, isLoading, error, refetch } = useInbox()
  const createItem = useCreateInboxItem()
  const processItem = useProcessInboxItem()
  const deleteItem = useDeleteInboxItem()

  if (isLoading) return <InboxSkeleton />

  if (error && !items) {
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
    <InboxContent
      items={items ?? []}
      onCreateItem={(input: CreateInboxItemInput) => createItem.mutate(input)}
      onProcessItem={(id: InboxItemId, input: ProcessInboxItemInput) =>
        processItem.mutate({ id, input })
      }
      onDeleteItem={(id: InboxItemId) => deleteItem.mutate(id)}
      isCreating={createItem.isPending}
    />
  )
}
