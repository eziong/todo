import { useState, useRef } from "react"

export type SaveStatus = "idle" | "saving" | "saved"

/**
 * Tracks save status for auto-save editors.
 *
 * Flow: idle → saving → saved → (2s) → idle
 * If `markSaving` is called while a "saved" timer is pending, the timer
 * is cancelled and status returns to "saving".
 */
export function useSaveStatus() {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const markSaving = () => {
    clearTimer()
    setStatus("saving")
  }

  const markSaved = () => {
    clearTimer()
    setStatus("saved")
    timerRef.current = setTimeout(() => {
      setStatus("idle")
      timerRef.current = null
    }, 2000)
  }

  return { status, markSaving, markSaved } as const
}
