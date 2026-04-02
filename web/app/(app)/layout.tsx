'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { CommandPalette } from '@/components/layout/command-palette'
import { useAppStore } from '@/stores/app-store'
import { useUndo } from '@/hooks/useUndo'
import { Loader2 } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)
  const commandOpen = useAppStore((s) => s.commandOpen)
  const setCommandOpen = useAppStore((s) => s.setCommandOpen)
  const { undo, redo } = useUndo()

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip when typing in inputs (except our own shortcuts)
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (e.isComposing) return

      // Cmd+Z — undo (skip if in input)
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey && !isInput) {
        e.preventDefault()
        undo()
        return
      }

      // Cmd+Shift+Z — redo (skip if in input)
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey && !isInput) {
        e.preventDefault()
        redo()
        return
      }

      // Cmd+N — focus quick add / navigate to tasks
      if (e.key === 'n' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault()
        useAppStore.getState().requestQuickAddFocus()
        if (pathname !== '/tasks') router.push('/tasks')
        return
      }

      // Cmd+Shift+N — navigate to projects
      if (e.key === 'n' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        router.push('/projects')
        return
      }

      // Cmd+[ — toggle sidebar (skip if in input)
      if (e.key === '[' && (e.metaKey || e.ctrlKey) && !isInput) {
        e.preventDefault()
        useAppStore.getState().toggleSidebar()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pathname, router, undo, redo])

  // Auth guard — loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Auth guard — redirect if not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <>
      {/* Desktop Layout (>= 768px) */}
      <div className="hidden md:flex flex-col h-screen bg-background">
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />

          {/* Main content area */}
          <main className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Layout (< 768px) - simplified for now */}
      <div className="md:hidden flex flex-col h-screen bg-background">
        <main className="flex-1 overflow-auto px-4 py-4">
          {children}
        </main>
      </div>

      {/* Command Palette (shared) */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  )
}
