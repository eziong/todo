import { Loader2, Check } from "lucide-react"
import type { SaveStatus as SaveStatusType } from "@/hooks/useSaveStatus"

interface SaveStatusProps {
  status: SaveStatusType
}

export function SaveStatus({ status }: SaveStatusProps) {
  if (status === "idle") return null

  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-foreground-secondary">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving...
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-xs text-accent-green">
      <Check className="h-3 w-3" />
      Saved
    </span>
  )
}
