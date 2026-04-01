import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import {
  fetchAssets,
  fetchAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  uploadAssetFile,
} from '@/services/assets'
import { fetchDriveFiles, uploadToDrive } from '@/services/drive'
import type { AssetId } from '@/types/branded'
import type { AssetFilters, CreateAssetInput, UpdateAssetInput } from '@/types/domain'

export function useAssets(filters?: AssetFilters) {
  return useQuery({
    queryKey: queryKeys.assets.list(filters),
    queryFn: () => fetchAssets(filters),
  })
}

export function useAsset(id: string | null) {
  return useQuery({
    queryKey: queryKeys.assets.detail(id as unknown as AssetId),
    queryFn: () => fetchAsset(id!),
    enabled: Boolean(id),
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAssetInput) => createAsset(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
    onError: handleMutationError,
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: AssetId; input: UpdateAssetInput }) =>
      updateAsset(id, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
    onError: handleMutationError,
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: AssetId) => deleteAsset(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
    onError: handleMutationError,
  })
}

export function useUploadAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file }: { file: File; userId?: string }) => {
      return uploadAssetFile(file)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
    },
    onError: handleMutationError,
  })
}

export function useUploadToDrive(projectId: string) {
  const queryClient = useQueryClient()
  const createAssetMutation = useCreateAsset()

  return useMutation({
    mutationFn: async (file: File) => {
      const driveFile = await uploadToDrive(projectId, file)

      const asset = await createAssetMutation.mutateAsync({
        filename: driveFile.name,
        mimeType: driveFile.mimeType,
        sizeBytes: driveFile.size,
        storageType: 'google_drive',
        storagePath: driveFile.id,
        thumbnailUrl: driveFile.thumbnailLink ?? undefined,
      })

      return asset
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.drive.all })
    },
    onError: handleMutationError,
  })
}

export function useDriveFiles(projectId: string, options?: { pageToken?: string; mimeType?: string }) {
  return useQuery({
    queryKey: queryKeys.drive.fileList(projectId, options),
    queryFn: () => fetchDriveFiles(projectId, options),
    enabled: Boolean(projectId),
  })
}
