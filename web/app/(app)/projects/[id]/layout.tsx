'use client'

import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  CheckSquare,
  Hammer,
  Film,

  Image,
  Youtube,
  DollarSign,
  FileText,
  Link2,
  Settings,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectId } from '@/types/branded'
import { useProject } from '@/hooks/useProject'
import { ProjectsSkeleton } from '@/components/features/projects/projects-skeleton'
import { classifyError } from '@/lib/errors'
import type { ProjectFeature } from '@/types/domain'

interface TabConfig {
  feature: ProjectFeature | 'overview' | 'settings'
  label: string
  path: string
  icon: React.ElementType
}

const TAB_CONFIG: TabConfig[] = [
  { feature: 'overview', label: 'Overview', path: '', icon: LayoutDashboard },
  { feature: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { feature: 'builds', label: 'Builds', path: '/builds', icon: Hammer },
  { feature: 'content', label: 'Content', path: '/content', icon: Film },

  { feature: 'assets', label: 'Assets', path: '/assets', icon: Image },
  { feature: 'youtube', label: 'YouTube', path: '/youtube', icon: Youtube },
  { feature: 'revenue', label: 'Revenue', path: '/revenue', icon: DollarSign },
  { feature: 'notes', label: 'Notes', path: '/notes', icon: FileText },
  { feature: 'links', label: 'Links', path: '/links', icon: Link2 },
  { feature: 'settings', label: 'Settings', path: '/settings', icon: Settings },
]

function getProjectDotColor(color: string | null): string {
  switch (color) {
    case 'blue': return 'bg-accent-blue'
    case 'purple': return 'bg-accent-purple'
    case 'green': return 'bg-accent-green'
    case 'orange': return 'bg-accent-orange'
    case 'red': return 'bg-accent-red'
    case 'pink': return 'bg-accent-pink'
    case 'yellow': return 'bg-accent-yellow'
    default: return 'bg-accent-gray'
  }
}

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams<{ id: string }>()
  const pathname = usePathname()
  const projectId = ProjectId(params.id)

  const { data: project, isLoading, error, refetch } = useProject(projectId)

  if (isLoading) return <ProjectsSkeleton />

  if (error && !project) {
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

  if (!project) return null

  const basePath = `/projects/${params.id}`

  const visibleTabs = TAB_CONFIG.filter((tab) => {
    if (tab.feature === 'overview' || tab.feature === 'settings') return true
    return project.features.includes(tab.feature)
  })

  const isTabActive = (tabPath: string) => {
    const fullPath = basePath + tabPath
    if (tabPath === '') {
      return pathname === basePath || pathname === basePath + '/'
    }
    return pathname.startsWith(fullPath)
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Project Header */}
      <div className="border-b border-border pt-6 pb-0">
        <div className="flex items-center gap-3">
          <span className={cn('h-3 w-3 rounded-full', getProjectDotColor(project.color))} />
          <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
        </div>
        {project.description && (
          <p className="mt-1 text-sm text-foreground-secondary">{project.description}</p>
        )}

        {/* Tab Bar */}
        <nav className="mt-4 flex gap-1 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const active = isTabActive(tab.path)
            return (
              <Link
                key={tab.path}
                href={basePath + tab.path}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-accent-blue text-foreground'
                    : 'border-transparent text-foreground-secondary hover:border-border hover:text-foreground'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto py-6">
        {children}
      </div>
    </div>
  )
}
