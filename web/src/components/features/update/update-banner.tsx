"use client"

import { useState, useEffect } from "react"
import { Download, RefreshCw, X, ArrowDownToLine } from "lucide-react"
import { cn } from "@/lib/utils"

type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"

interface UpdateInfo {
  version: string
  releaseNotes?: string
}

export function UpdateBanner() {
  const [isElectron, setIsElectron] = useState(false)
  const [state, setState] = useState<UpdateState>("idle")
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  // Detect Electron environment (client-side only)
  useEffect(() => {
    setIsElectron(!!window.desktop?.isElectron)
  }, [])

  // Subscribe to update events
  useEffect(() => {
    const desktop = window.desktop
    if (!desktop?.isElectron) return

    const cleanups: (() => void)[] = []

    cleanups.push(
      desktop.onUpdateAvailable((info) => {
        setState("available")
        setUpdateInfo({ version: info.version, releaseNotes: info.releaseNotes })
        setDismissed(false)
      })
    )

    cleanups.push(
      desktop.onUpdateNotAvailable(() => {
        setState("idle")
      })
    )

    cleanups.push(
      desktop.onDownloadProgress((prog) => {
        setState("downloading")
        setProgress(Math.round(prog.percent))
      })
    )

    cleanups.push(
      desktop.onUpdateDownloaded(() => {
        setState("ready")
        setProgress(100)
      })
    )

    cleanups.push(
      desktop.onUpdateError(() => {
        setState("error")
      })
    )

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [isElectron])

  // Don't render on server, in browser, or when idle/dismissed
  if (!isElectron) return null
  if (state === "idle" || state === "checking") return null
  if (dismissed && state !== "ready") return null

  const handleDownload = () => {
    window.desktop?.downloadUpdate()
    setState("downloading")
    setProgress(0)
  }

  const handleInstall = () => {
    window.desktop?.installUpdate()
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm border-b",
        state === "ready"
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : state === "error"
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
      )}
    >
      {/* Icon */}
      {state === "available" && <ArrowDownToLine className="h-4 w-4 shrink-0" />}
      {state === "downloading" && <Download className="h-4 w-4 shrink-0 animate-pulse" />}
      {state === "ready" && <RefreshCw className="h-4 w-4 shrink-0" />}

      {/* Message */}
      <span className="flex-1 truncate">
        {state === "available" && `v${updateInfo?.version} is available`}
        {state === "downloading" && `Downloading update... ${progress}%`}
        {state === "ready" && `v${updateInfo?.version} is ready to install`}
        {state === "error" && "Update check failed"}
      </span>

      {/* Progress bar (downloading) */}
      {state === "downloading" && (
        <div className="w-24 h-1.5 bg-blue-500/20 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Action button */}
      {state === "available" && (
        <button
          onClick={handleDownload}
          className="shrink-0 px-2.5 py-1 rounded text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
        >
          Update
        </button>
      )}
      {state === "ready" && (
        <button
          onClick={handleInstall}
          className="shrink-0 px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
        >
          Restart
        </button>
      )}

      {/* Dismiss (only for available/error states) */}
      {(state === "available" || state === "error") && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
