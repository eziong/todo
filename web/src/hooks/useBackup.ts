import { useQuery, useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { handleMutationError } from '@/lib/errors'
import { fetchBackupInfo, exportBackup, importBackup } from '@/services/backup'

export function useBackupInfo() {
  return useQuery({
    queryKey: queryKeys.backup.info(),
    queryFn: fetchBackupInfo,
    staleTime: 30_000,
  })
}

export function useExportBackup() {
  return useMutation({
    mutationFn: (includeAssets: boolean) => exportBackup(includeAssets),
    onSuccess: (blob, includeAssets) => {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19)
      const filename = includeAssets
        ? `backup-full-${timestamp}.zip`
        : `backup-db-${timestamp}.zip`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    onError: handleMutationError,
  })
}

export function useImportBackup() {
  return useMutation({
    mutationFn: (file: File) => importBackup(file),
    onError: handleMutationError,
  })
}
