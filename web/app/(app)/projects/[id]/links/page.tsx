'use client'

import { useParams } from 'next/navigation'
import { useLinks, useCreateLink, useUpdateLink, useDeleteLink, useIncrementLinkClick } from '@/hooks/useLinks'
import {
  useDescriptionTemplates,
  useCreateDescriptionTemplate,
  useUpdateDescriptionTemplate,
  useDeleteDescriptionTemplate,
} from '@/hooks/useDescriptionTemplates'
import { LinksContent } from '@/components/features/links/links-content'
import { LinksSkeleton } from '@/components/features/links/links-skeleton'
import { classifyError } from '@/lib/errors'
import type { LinkId, DescriptionTemplateId } from '@/types/branded'
import type {
  CreateLinkInput,
  UpdateLinkInput,
  CreateDescriptionTemplateInput,
  UpdateDescriptionTemplateInput,
} from '@/types/domain'

export default function ProjectLinksPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const { data: links, isLoading: linksLoading, error: linksError, refetch } = useLinks({ projectId })
  const { data: templates, isLoading: templatesLoading } = useDescriptionTemplates()
  const createLink = useCreateLink()
  const updateLink = useUpdateLink()
  const deleteLink = useDeleteLink()
  const incrementClick = useIncrementLinkClick()
  const createTemplate = useCreateDescriptionTemplate()
  const updateTemplate = useUpdateDescriptionTemplate()
  const deleteTemplate = useDeleteDescriptionTemplate()

  const isLoading = linksLoading || templatesLoading

  if (isLoading) return <LinksSkeleton />

  if (linksError && !links) {
    const classified = classifyError(linksError)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-foreground">{classified.title}</p>
        <p className="text-sm text-foreground-secondary">{classified.message}</p>
        {classified.retryable && (
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  return (
    <LinksContent
      links={links ?? []}
      templates={templates ?? []}
      onCreateLink={(input: CreateLinkInput) =>
        createLink.mutate({ ...input, projectId })
      }
      onUpdateLink={(id: LinkId, input: UpdateLinkInput) =>
        updateLink.mutate({ id, input })
      }
      onDeleteLink={(id: LinkId) => deleteLink.mutate(id)}
      onLinkClick={(id: LinkId) => incrementClick.mutate(id)}
      onCreateTemplate={(input: CreateDescriptionTemplateInput) =>
        createTemplate.mutate(input)
      }
      onUpdateTemplate={(id: DescriptionTemplateId, input: UpdateDescriptionTemplateInput) =>
        updateTemplate.mutate({ id, input })
      }
      onDeleteTemplate={(id: DescriptionTemplateId) => deleteTemplate.mutate(id)}
      isCreatingLink={createLink.isPending}
      isCreatingTemplate={createTemplate.isPending}
    />
  )
}
