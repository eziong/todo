import { useEffect, useRef } from "react"

/**
 * Prevents accidental tab close / refresh when there are unsaved changes.
 * Uses a ref so the listener always reads the latest `isDirty` value
 * without needing to re-attach on every render.
 */
export function useBeforeUnload(isDirty: boolean) {
  const dirtyRef = useRef(isDirty)
  dirtyRef.current = isDirty

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      e.preventDefault()
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])
}
