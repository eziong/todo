"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterSectionProps {
  title: string
  children: React.ReactNode
}

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="py-1">
      <div className="px-2 py-1 text-xs uppercase tracking-wider text-foreground-secondary/60">
        {title}
      </div>
      {children}
    </div>
  )
}

interface FilterOptionProps {
  label: string
  selected?: boolean
  dot?: string
  onClick?: () => void
}

export function FilterOption({ label, selected, dot, onClick }: FilterOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm transition-colors",
        selected
          ? "bg-background-tertiary text-foreground"
          : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
      )}
    >
      {dot && <div className={cn("h-2 w-2 rounded-full", dot)} />}
      <span className="flex-1 text-left">{label}</span>
      {selected && <Check className="h-3.5 w-3.5 text-accent-blue" />}
    </button>
  )
}
