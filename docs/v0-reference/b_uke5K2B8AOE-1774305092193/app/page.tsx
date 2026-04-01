"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandPalette } from "@/components/command-palette"
import { DashboardContent } from "@/components/dashboard-content"
import { InboxContent } from "@/components/inbox-content"
import { TasksContent } from "@/components/tasks-content"
import { BuildsContent } from "@/components/builds-content"
import { SettingsContent } from "@/components/settings-content"
import { MobileDashboard } from "@/components/mobile-dashboard"

export type ViewType = "dashboard" | "inbox" | "today" | "tasks" | "builds" | "settings"

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [activeView, setActiveView] = useState<ViewType>("inbox")

  return (
    <>
      {/* Mobile Layout (< 768px) */}
      <div className="md:hidden">
        <MobileDashboard 
          onOpenCommandPalette={() => setCommandOpen(true)}
          onViewChange={setActiveView}
        />
      </div>

      {/* Desktop Layout (>= 768px) */}
      <div className="hidden md:flex h-screen bg-background">
        <AppSidebar 
          collapsed={sidebarCollapsed} 
          onCollapsedChange={setSidebarCollapsed}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        
        {/* Main content area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Dashboard header (only for dashboard) */}
          {activeView === "dashboard" && (
            <header className="flex h-14 shrink-0 items-center justify-between px-6">
              <h1 className="text-base text-foreground-secondary">Good morning, Atom</h1>
              <span className="text-sm text-foreground-secondary">March 23, Mon</span>
            </header>
          )}

          {/* Content area */}
          <div className="flex-1 overflow-auto px-6 py-6">
            <div className="mx-auto max-w-[960px]">
              {activeView === "dashboard" && <DashboardContent />}
              {activeView === "inbox" && <InboxContent />}
              {activeView === "today" && (
                <div className="flex h-64 items-center justify-center rounded-[8px] border border-dashed border-border">
                  <p className="text-foreground-secondary">Today view coming soon</p>
                </div>
              )}
              {activeView === "tasks" && <TasksContent />}
              {activeView === "builds" && <BuildsContent />}
              {activeView === "settings" && <SettingsContent />}
            </div>
          </div>
        </main>
      </div>

      {/* Command Palette (shared) */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  )
}
