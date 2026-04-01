'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { useGoogleConnection } from '@/hooks/useGoogleAuth'
import { useYouTubeAnalytics } from '@/hooks/useRevenue'
import {
  useSponsorships,
  useCreateSponsorship,
  useUpdateSponsorship,
  useDeleteSponsorship,
} from '@/hooks/useSponsorships'
import { useContents } from '@/hooks/useContents'
import { RevenueDashboard } from '@/components/features/revenue/revenue-dashboard'
import { SponsorshipFormDialog } from '@/components/features/revenue/sponsorship-form-dialog'
import { RevenueSkeleton } from '@/components/features/revenue/revenue-skeleton'
import { classifyError } from '@/lib/errors'
import type {
  SponsorshipWithContent,
  SponsorshipStatus,
  CreateSponsorshipInput,
  UpdateSponsorshipInput,
  RevenueSummary,
} from '@/types/domain'
import type { SponsorshipId } from '@/types/branded'

export default function ProjectRevenuePage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [formOpen, setFormOpen] = useState(false)
  const [editingSponsorship, setEditingSponsorship] = useState<SponsorshipWithContent | null>(null)

  const params = useParams<{ id: string }>()
  const projectId = params.id

  const { data: connection } = useGoogleConnection(projectId)
  const isYouTubeConnected = connection?.youtubeConnected ?? false

  const {
    data: analyticsResponse,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useYouTubeAnalytics(projectId, isYouTubeConnected ? selectedYear : undefined)

  const {
    data: sponsorships,
    isLoading: sponsorshipsLoading,
    error: sponsorshipsError,
    refetch: refetchSponsorships,
  } = useSponsorships()

  const { data: contents } = useContents()

  const createSponsorship = useCreateSponsorship()
  const updateSponsorship = useUpdateSponsorship()
  const deleteSponsorship = useDeleteSponsorship()

  const isLoading = sponsorshipsLoading || (isYouTubeConnected && analyticsLoading)
  const error = sponsorshipsError || analyticsError

  if (isLoading) return <RevenueSkeleton />

  if (error && !sponsorships) {
    const classified = classifyError(error)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-foreground">{classified.title}</p>
        <p className="text-sm text-foreground-secondary">{classified.message}</p>
        {classified.retryable && (
          <button
            onClick={() => refetchSponsorships()}
            className="rounded-[6px] bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  const analyticsData = analyticsResponse?.analytics ?? []
  const sponsorshipList = sponsorships ?? []
  const contentList = contents ?? []

  const summary: RevenueSummary = {
    totalAdRevenue: analyticsData.reduce((sum, a) => sum + a.estimatedRevenue, 0),
    totalSponsorships: sponsorshipList
      .filter((s) => s.status === 'paid' || s.status === 'delivered')
      .reduce((sum, s) => sum + s.amount, 0),
    totalRevenue: 0,
    paidCount: sponsorshipList.filter((s) => s.status === 'paid').length,
    pendingCount: sponsorshipList.filter(
      (s) => s.status === 'negotiating' || s.status === 'confirmed'
    ).length,
  }
  summary.totalRevenue = summary.totalAdRevenue + summary.totalSponsorships

  const handleAddSponsorship = () => {
    setEditingSponsorship(null)
    setFormOpen(true)
  }

  const handleEditSponsorship = (sponsorship: SponsorshipWithContent) => {
    setEditingSponsorship(sponsorship)
    setFormOpen(true)
  }

  const handleDeleteSponsorship = (id: SponsorshipId) => {
    deleteSponsorship.mutate(id, {
      onSuccess: () => {
        toast.success('Sponsorship deleted')
      },
    })
  }

  const handleStatusChange = (id: SponsorshipId, status: SponsorshipStatus) => {
    const input: UpdateSponsorshipInput = { status }
    if (status === 'paid') {
      input.paidAt = new Date().toISOString()
    }

    updateSponsorship.mutate(
      { id, input },
      {
        onSuccess: () => {
          toast.success(`Status updated to ${status}`)
        },
      }
    )
  }

  const handleFormSubmit = (input: CreateSponsorshipInput | UpdateSponsorshipInput) => {
    if (editingSponsorship) {
      updateSponsorship.mutate(
        { id: editingSponsorship.id, input: input as UpdateSponsorshipInput },
        {
          onSuccess: () => {
            toast.success('Sponsorship updated')
          },
        }
      )
    } else {
      createSponsorship.mutate(input as CreateSponsorshipInput, {
        onSuccess: () => {
          toast.success('Sponsorship created')
        },
      })
    }
  }

  return (
    <>
      <RevenueDashboard
        analyticsData={analyticsData}
        analyticsYear={selectedYear}
        onYearChange={setSelectedYear}
        sponsorships={sponsorshipList}
        summary={summary}
        isYouTubeConnected={isYouTubeConnected}
        onAddSponsorship={handleAddSponsorship}
        onEditSponsorship={handleEditSponsorship}
        onDeleteSponsorship={handleDeleteSponsorship}
        onStatusChange={handleStatusChange}
      />

      <SponsorshipFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        sponsorship={editingSponsorship}
        contents={contentList.map((c) => ({ id: c.id, title: c.title }))}
        onSubmit={handleFormSubmit}
        isPending={createSponsorship.isPending || updateSponsorship.isPending}
      />
    </>
  )
}
