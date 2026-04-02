"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Database, Download, Upload, HardDrive, FileArchive, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { useAppStore } from "@/stores/app-store"
import { useBackupInfo, useExportBackup, useImportBackup } from "@/hooks/useBackup"

type Theme = "dark" | "light" | "system"

interface KeyboardShortcut {
  action: string
  shortcut: string
}

const keyboardShortcuts: KeyboardShortcut[] = [
  { action: "Command bar", shortcut: "\u2318K" },
  { action: "New task", shortcut: "\u2318N" },
  { action: "New project", shortcut: "\u2318\u21E7N" },
  { action: "Toggle sidebar", shortcut: "\u2318[" },
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function SettingsContent() {
  const { user } = useAuth()
  const { theme: currentTheme, setTheme } = useTheme()
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: backupInfo } = useBackupInfo()
  const exportMutation = useExportBackup()
  const importMutation = useImportBackup()

  useEffect(() => { setMounted(true) }, [])

  const handleImportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset for re-selection

    const confirmed = window.confirm(
      'This will replace your current database and assets with the backup. A backup of current data will be created automatically. Continue?'
    )
    if (!confirmed) return

    importMutation.mutate(file, {
      onSuccess: () => {
        setTimeout(() => window.location.reload(), 1500)
      },
    })
  }

  const activeTheme = (mounted ? currentTheme : "dark") as Theme

  return (
    <div className="mx-auto max-w-[640px] space-y-8">
      {/* Page header */}
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>

      {/* Profile Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Profile</h2>
        <div className="space-y-4">
          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-sm text-foreground-secondary">Email</label>
            <input
              type="email"
              value={user?.email ?? ""}
              readOnly
              className="h-10 w-full cursor-not-allowed rounded-lg border border-border bg-background-secondary/50 px-3 text-sm text-foreground-secondary"
            />
            <p className="text-xs text-foreground-secondary">Google Account</p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Appearance Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Appearance</h2>
        <div className="space-y-4">
          {/* Theme radio group */}
          <div className="space-y-2">
            <label className="text-sm text-foreground-secondary">Theme</label>
            <div className="flex gap-2">
              {(["dark", "light", "system"] as Theme[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setTheme(option)}
                  className={cn(
                    "flex h-9 items-center rounded-lg border px-4 text-sm capitalize transition-colors",
                    activeTheme === option
                      ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                      : "border-border bg-background-secondary text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {/* Sidebar toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-foreground">Collapse sidebar by default</label>
              <p className="text-xs text-foreground-secondary">Start with a compact sidebar on load</p>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                sidebarCollapsed ? "bg-accent-blue" : "bg-background-tertiary"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
                  sidebarCollapsed ? "left-6" : "left-1"
                )}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Keyboard Shortcuts Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Keyboard Shortcuts</h2>
        <div className="rounded-xl border border-border bg-background-secondary overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                  Action
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                  Shortcut
                </th>
              </tr>
            </thead>
            <tbody>
              {keyboardShortcuts.map((shortcut) => (
                <tr
                  key={shortcut.action}
                  className="border-b border-border last:border-0 transition-colors hover:bg-background-tertiary"
                >
                  <td className="px-4 py-3 text-sm text-foreground">{shortcut.action}</td>
                  <td className="px-4 py-3 text-right">
                    <kbd className="rounded bg-background px-2 py-1 font-mono text-xs text-foreground-secondary">
                      {shortcut.shortcut}
                    </kbd>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Data Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Data</h2>

        {/* Backup info */}
        {backupInfo && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-background-secondary p-4">
              <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                <Database className="h-4 w-4" />
                Database
              </div>
              <p className="mt-1 text-lg font-medium text-foreground">
                {formatBytes(backupInfo.dbSizeBytes)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background-secondary p-4">
              <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                <HardDrive className="h-4 w-4" />
                Assets
              </div>
              <p className="mt-1 text-lg font-medium text-foreground">
                {backupInfo.assetCount} files
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background-secondary p-4">
              <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                <FileArchive className="h-4 w-4" />
                Total Size
              </div>
              <p className="mt-1 text-lg font-medium text-foreground">
                {formatBytes(backupInfo.dbSizeBytes + backupInfo.totalAssetBytes)}
              </p>
            </div>
          </div>
        )}

        {/* Export buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => exportMutation.mutate(false)}
            disabled={exportMutation.isPending}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background-secondary px-4 text-sm text-foreground transition-colors hover:bg-background-tertiary disabled:opacity-50"
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export (DB only)
          </button>
          <button
            onClick={() => exportMutation.mutate(true)}
            disabled={exportMutation.isPending}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background-secondary px-4 text-sm text-foreground transition-colors hover:bg-background-tertiary disabled:opacity-50"
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export (Full)
          </button>
        </div>

        {/* Import */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleImportSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background-secondary px-4 text-sm text-foreground transition-colors hover:bg-background-tertiary disabled:opacity-50"
          >
            {importMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import Backup
          </button>
          {importMutation.isPending && (
            <p className="text-sm text-foreground-secondary">Importing... This may take a moment.</p>
          )}
          {importMutation.isSuccess && (
            <p className="text-sm text-green-500">Import successful. Reloading...</p>
          )}
        </div>
      </section>
    </div>
  )
}
