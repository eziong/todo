'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { useGoogleConnection } from '@/hooks/useGoogleAuth'
import {
  useAssets,
  useUpdateAsset,
  useDeleteAsset,
  useUploadAsset,
  useUploadToDrive,
  useDriveFiles,
} from '@/hooks/useAssets'
import { useAuth } from '@/components/providers/auth-provider'
import { AssetBrowser } from '@/components/features/assets/asset-browser'
import { UploadZone } from '@/components/features/assets/upload-zone'
import { AssetDetailDialog } from '@/components/features/assets/asset-detail-dialog'
import { AssetsSkeleton } from '@/components/features/assets/assets-skeleton'
import { classifyError } from '@/lib/errors'
import type { Asset, AssetFilters, UpdateAssetInput } from '@/types/domain'
import type { AssetId } from '@/types/branded'

export default function ProjectAssetsPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  const { user } = useAuth()
  const [filters, setFilters] = useState<AssetFilters>({ projectId })
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: connection } = useGoogleConnection(projectId)
  const googleConnected = connection?.driveConnected ?? false

  const { data: assets, isLoading, error, refetch } = useAssets(filters)
  const { data: driveData } = useDriveFiles(projectId)

  const updateAsset = useUpdateAsset()
  const deleteAsset = useDeleteAsset()
  const uploadAsset = useUploadAsset()
  const uploadToDrive = useUploadToDrive(projectId)

  const isUploading = uploadAsset.isPending || uploadToDrive.isPending

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setDetailOpen(true)
  }

  const handleDelete = (asset: Asset) => {
    deleteAsset.mutate(asset.id, {
      onSuccess: () => {
        toast.success('Asset deleted')
        if (selectedAsset?.id === asset.id) {
          setDetailOpen(false)
          setSelectedAsset(null)
        }
      },
    })
  }

  const handleUpdate = (id: AssetId, input: UpdateAssetInput) => {
    updateAsset.mutate(
      { id, input },
      {
        onSuccess: (updated) => {
          setSelectedAsset(updated)
          toast.success('Asset updated')
        },
      }
    )
  }

  const handleUploadLocal = (file: File) => {
    if (!user) return
    uploadAsset.mutate(
      { file, userId: user.id },
      {
        onSuccess: () => {
          toast.success('File uploaded to Local Storage')
        },
      }
    )
  }

  const handleUploadDrive = (file: File) => {
    uploadToDrive.mutate(file, {
      onSuccess: () => {
        toast.success('File uploaded to Google Drive')
      },
    })
  }

  if (isLoading) return <AssetsSkeleton />

  if (error && !assets) {
    const classified = classifyError(error)
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
    <div className="space-y-8 py-6">
      <UploadZone
        onUploadLocal={handleUploadLocal}
        onUploadDrive={handleUploadDrive}
        isUploading={isUploading}
        googleConnected={googleConnected}
      />

      <AssetBrowser
        assets={assets ?? []}
        driveFiles={driveData?.files ?? []}
        filters={filters}
        onFilterChange={setFilters}
        onSelectAsset={handleSelectAsset}
        onDelete={handleDelete}
        isLoading={isLoading}
        googleConnected={googleConnected}
      />

      <AssetDetailDialog
        asset={selectedAsset}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdate}
        onDelete={(id) => {
          const asset = assets?.find((a) => a.id === id)
          if (asset) handleDelete(asset)
        }}
        isUpdating={updateAsset.isPending}
      />
    </div>
  )
}
