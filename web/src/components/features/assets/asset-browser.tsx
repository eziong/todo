"use client"

import { useState } from 'react'
import {
  Image,
  Film,
  FileText,
  LayoutGrid,
  List,
  Search,
  Trash2,
  HardDrive,
  Cloud,
  FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Asset, DriveFile, AssetFilters, AssetStorageType } from '@/types/domain'

type AssetTypeFilter = 'all' | 'image' | 'video' | 'document'
type ViewMode = 'grid' | 'list'

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
  return `${bytes} B`
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('video/')) return Film
  return FileText
}

function getStorageIcon(storageType: AssetStorageType) {
  return storageType === 'local' ? HardDrive : Cloud
}

const typeFilters: { value: AssetTypeFilter; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: FolderOpen },
  { value: 'image', label: 'Images', icon: Image },
  { value: 'video', label: 'Videos', icon: Film },
  { value: 'document', label: 'Documents', icon: FileText },
]

interface AssetBrowserProps {
  assets: Asset[]
  driveFiles: DriveFile[]
  filters: AssetFilters
  onFilterChange: (filters: AssetFilters) => void
  onSelectAsset: (asset: Asset) => void
  onDelete: (asset: Asset) => void
  isLoading?: boolean
  googleConnected: boolean
}

export function AssetBrowser({
  assets,
  driveFiles: _driveFiles,
  filters,
  onFilterChange,
  onSelectAsset,
  onDelete,
  googleConnected,
}: AssetBrowserProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [typeFilter, setTypeFilter] = useState<AssetTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState(filters.search ?? '')

  const handleTypeFilter = (type: AssetTypeFilter) => {
    setTypeFilter(type)
    onFilterChange({
      ...filters,
      mimeType: type === 'all' ? undefined : `${type}/`,
    })
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onFilterChange({ ...filters, search: value || undefined })
  }

  const handleStorageFilter = (storageType: AssetStorageType | undefined) => {
    onFilterChange({ ...filters, storageType })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Assets</h1>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search files..."
              className="h-9 w-64 rounded-lg border border-border bg-background-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>

          {/* Storage filter */}
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={() => handleStorageFilter(undefined)}
              className={cn(
                "h-9 px-3 text-xs font-medium transition-colors first:rounded-l-[6px] last:rounded-r-[6px]",
                !filters.storageType
                  ? "bg-accent-blue text-white"
                  : "text-foreground-secondary hover:bg-background-tertiary"
              )}
            >
              All
            </button>
            <button
              onClick={() => handleStorageFilter('local')}
              className={cn(
                "flex h-9 items-center gap-1.5 border-l border-border px-3 text-xs font-medium transition-colors",
                filters.storageType === 'local'
                  ? "bg-accent-blue text-white"
                  : "text-foreground-secondary hover:bg-background-tertiary"
              )}
            >
              <HardDrive className="h-3 w-3" />
              Local
            </button>
            {googleConnected && (
              <button
                onClick={() => handleStorageFilter('google_drive')}
                className={cn(
                  "flex h-9 items-center gap-1.5 border-l border-border px-3 text-xs font-medium transition-colors last:rounded-r-[6px]",
                  filters.storageType === 'google_drive'
                    ? "bg-accent-blue text-white"
                    : "text-foreground-secondary hover:bg-background-tertiary"
                )}
              >
                <Cloud className="h-3 w-3" />
                Drive
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-l-[6px] transition-colors",
                viewMode === 'grid'
                  ? "bg-background-tertiary text-foreground"
                  : "text-foreground-secondary hover:bg-background-tertiary"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-r-[6px] border-l border-border transition-colors",
                viewMode === 'list'
                  ? "bg-background-tertiary text-foreground"
                  : "text-foreground-secondary hover:bg-background-tertiary"
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2">
        {typeFilters.map((tf) => (
          <button
            key={tf.value}
            onClick={() => handleTypeFilter(tf.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              typeFilter === tf.value
                ? "bg-accent-blue/10 text-accent-blue"
                : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
            )}
          >
            <tf.icon className="h-4 w-4" />
            {tf.label}
          </button>
        ))}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.map((asset) => {
            const MimeIcon = getMimeIcon(asset.mimeType)
            const StorageIcon = getStorageIcon(asset.storageType)
            const isImage = asset.mimeType.startsWith('image/')

            return (
              <button
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className="group w-full text-left space-y-2"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-background-secondary transition-colors group-hover:border-accent-blue/50">
                  {isImage && asset.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.filename}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                      <MimeIcon className="h-10 w-10 text-foreground-secondary" />
                    </div>
                  )}
                  {/* Storage badge */}
                  <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                    <StorageIcon className="h-2.5 w-2.5" />
                    {asset.storageType === 'local' ? 'Local' : 'Drive'}
                  </span>
                  {/* Delete on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(asset)
                    }}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="truncate text-sm text-foreground group-hover:text-accent-blue transition-colors">
                    {asset.filename}
                  </p>
                  <p className="text-xs text-foreground-secondary">
                    {formatFileSize(asset.sizeBytes)} · {formatRelativeDate(asset.createdAt)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="divide-y divide-border rounded-xl border border-border">
          {assets.map((asset) => {
            const MimeIcon = getMimeIcon(asset.mimeType)
            const StorageIcon = getStorageIcon(asset.storageType)

            return (
              <button
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-background-secondary"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background-tertiary">
                  <MimeIcon className="h-5 w-5 text-foreground-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{asset.filename}</p>
                  <p className="text-xs text-foreground-secondary">
                    {formatFileSize(asset.sizeBytes)} · {asset.mimeType}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                  <StorageIcon className="h-3.5 w-3.5" />
                  {asset.storageType === 'local' ? 'Local' : 'Drive'}
                </div>
                <span className="text-xs text-foreground-secondary">
                  {formatRelativeDate(asset.createdAt)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(asset)
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-secondary opacity-0 transition-all group-hover:opacity-100 hover:bg-accent-red/10 hover:text-accent-red"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {assets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="h-12 w-12 text-foreground-secondary" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No assets found</h3>
          <p className="mt-1 text-sm text-foreground-secondary">
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Upload your first file to get started.'}
          </p>
        </div>
      )}
    </div>
  )
}
