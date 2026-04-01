"use client"

import { useState } from "react"
import { 
  Github, 
  HardDrive,
  Youtube,
  Download,
  Trash2,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

type Theme = "dark" | "light" | "system"

interface KeyboardShortcut {
  action: string
  shortcut: string
}

const keyboardShortcuts: KeyboardShortcut[] = [
  { action: "Command bar", shortcut: "⌘K" },
  { action: "New task", shortcut: "⌘N" },
  { action: "New project", shortcut: "⌘⇧N" },
  { action: "Toggle sidebar", shortcut: "⌘[" },
]

interface Integration {
  id: string
  name: string
  icon: React.ElementType
  connected: boolean
}

const integrations: Integration[] = [
  { id: "github", name: "GitHub", icon: Github, connected: false },
  { id: "google-drive", name: "Google Drive", icon: HardDrive, connected: false },
  { id: "youtube", name: "YouTube", icon: Youtube, connected: false },
]

export function SettingsContent() {
  const [name, setName] = useState("Atom")
  const [theme, setTheme] = useState<Theme>("dark")
  const [collapseSidebar, setCollapseSidebar] = useState(false)
  const [hoveredShortcut, setHoveredShortcut] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-[640px] space-y-8">
      {/* Page header */}
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>

      {/* Profile Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Profile</h2>
        <div className="space-y-4">
          {/* Name input */}
          <div className="space-y-2">
            <label className="text-sm text-foreground-secondary">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-[6px] border border-border bg-background-secondary px-3 text-sm text-foreground placeholder:text-foreground-secondary focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>
          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-sm text-foreground-secondary">Email</label>
            <input
              type="email"
              value="atom@example.com"
              readOnly
              className="h-10 w-full cursor-not-allowed rounded-[6px] border border-border bg-background-secondary/50 px-3 text-sm text-foreground-secondary"
            />
            <p className="text-xs text-foreground-secondary">Managed by Supabase Auth</p>
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
                    "flex h-9 items-center rounded-[6px] border px-4 text-sm capitalize transition-colors",
                    theme === option
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
              onClick={() => setCollapseSidebar(!collapseSidebar)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                collapseSidebar ? "bg-accent-blue" : "bg-background-tertiary"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
                  collapseSidebar ? "left-6" : "left-1"
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
        <div className="rounded-[8px] border border-border bg-background-secondary overflow-hidden">
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
                  onMouseEnter={() => setHoveredShortcut(shortcut.action)}
                  onMouseLeave={() => setHoveredShortcut(null)}
                  className="group border-b border-border last:border-0 transition-colors hover:bg-background-tertiary"
                >
                  <td className="px-4 py-3 text-sm text-foreground">{shortcut.action}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <kbd className="rounded bg-background px-2 py-1 font-mono text-xs text-foreground-secondary">
                        {shortcut.shortcut}
                      </kbd>
                      <button
                        className={cn(
                          "text-xs text-accent-blue transition-opacity hover:underline",
                          hoveredShortcut === shortcut.action ? "opacity-100" : "opacity-0"
                        )}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Integrations Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Integrations</h2>
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between rounded-[8px] border border-border bg-background-secondary p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-background-tertiary">
                  <integration.icon className="h-5 w-5 text-foreground-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{integration.name}</p>
                  <p className="text-xs text-foreground-secondary">
                    {integration.connected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              <button
                className={cn(
                  "flex h-8 items-center gap-2 rounded-[6px] px-3 text-sm transition-colors",
                  integration.connected
                    ? "border border-border bg-background-tertiary text-foreground-secondary hover:bg-background hover:text-foreground"
                    : "bg-accent-blue text-white hover:bg-accent-blue/90"
                )}
              >
                {integration.connected ? (
                  "Manage"
                ) : (
                  <>
                    Connect
                    <ExternalLink className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Data Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Data</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="flex h-10 items-center justify-center gap-2 rounded-[6px] border border-border bg-background-secondary px-4 text-sm text-foreground transition-colors hover:bg-background-tertiary">
            <Download className="h-4 w-4" />
            Export all data
          </button>
          <button className="flex h-10 items-center justify-center gap-2 rounded-[6px] bg-accent-red px-4 text-sm font-medium text-white transition-colors hover:bg-accent-red/90">
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        </div>
        <p className="text-xs text-foreground-secondary">
          Deleting your account will permanently remove all your data. This action cannot be undone.
        </p>
      </section>
    </div>
  )
}
