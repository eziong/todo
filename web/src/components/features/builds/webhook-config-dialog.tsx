"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BuildCommand, CreateBuildCommandInput, UpdateBuildCommandInput, WebhookMethod } from "@/types/domain"

const METHODS: WebhookMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"]

interface HeaderEntry {
  key: string
  value: string
}

interface WebhookConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingConfig?: BuildCommand | null
  onSave: (input: CreateBuildCommandInput | UpdateBuildCommandInput) => void
  isPending: boolean
}

export function WebhookConfigDialog({
  open,
  onOpenChange,
  editingConfig,
  onSave,
  isPending,
}: WebhookConfigDialogProps) {
  const [label, setLabel] = useState("")
  const [method, setMethod] = useState<WebhookMethod>("POST")
  const [url, setUrl] = useState("")
  const [headers, setHeaders] = useState<HeaderEntry[]>([])
  const [bodyTemplate, setBodyTemplate] = useState("")

  const isEditing = Boolean(editingConfig)
  const bodyDisabled = method === "GET" || method === "DELETE"

  // Reset form when opened
  useEffect(() => {
    if (open) {
      if (editingConfig) {
        setLabel(editingConfig.label)
        setMethod(editingConfig.method)
        setUrl(editingConfig.url)
        setHeaders(
          Object.entries(editingConfig.headers).map(([key, value]) => ({
            key,
            value,
          }))
        )
        setBodyTemplate(editingConfig.bodyTemplate ?? "")
      } else {
        setLabel("")
        setMethod("POST")
        setUrl("")
        setHeaders([])
        setBodyTemplate("")
      }
    }
  }, [open, editingConfig])

  const addHeader = () => {
    setHeaders((prev) => [...prev, { key: "", value: "" }])
  }

  const removeHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index))
  }

  const updateHeader = (index: number, field: "key" | "value", val: string) => {
    setHeaders((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: val } : h))
    )
  }

  const handleSave = () => {
    if (!label.trim() || !url.trim()) return

    const headersObj: Record<string, string> = {}
    for (const h of headers) {
      if (h.key.trim()) {
        headersObj[h.key.trim()] = h.value
      }
    }

    const input: CreateBuildCommandInput | UpdateBuildCommandInput = {
      label: label.trim(),
      url: url.trim(),
      method,
      headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      bodyTemplate: !bodyDisabled && bodyTemplate.trim() ? bodyTemplate.trim() : undefined,
    }

    onSave(input)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[560px] gap-0 overflow-hidden rounded-xl border-border bg-background-secondary p-0 shadow-2xl"
      >
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold text-foreground">
            {isEditing ? "Edit Webhook" : "New Webhook"}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Deploy to production"
              className="border-border bg-background text-foreground placeholder:text-foreground-secondary/50"
            />
          </div>

          {/* Method + URL */}
          <div className="flex gap-2">
            <div className="w-[130px] shrink-0 space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as WebhookMethod)}>
                <SelectTrigger className="border-border bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm font-medium text-foreground">URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/webhook"
                className="border-border bg-background font-mono text-sm text-foreground placeholder:text-foreground-secondary/50"
              />
            </div>
          </div>

          {/* Headers */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">
                Headers
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addHeader}
                className="h-7 gap-1 px-2 text-xs text-foreground-secondary hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            {headers.length > 0 && (
              <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                {headers.map((header, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={header.key}
                      onChange={(e) => updateHeader(idx, "key", e.target.value)}
                      placeholder="Key"
                      className="h-8 border-border bg-background-secondary text-sm text-foreground placeholder:text-foreground-secondary/50"
                    />
                    <Input
                      value={header.value}
                      onChange={(e) => updateHeader(idx, "value", e.target.value)}
                      placeholder="Value"
                      className="h-8 border-border bg-background-secondary text-sm text-foreground placeholder:text-foreground-secondary/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHeader(idx)}
                      className="h-8 w-8 shrink-0 p-0 text-foreground-secondary hover:text-accent-red"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {headers.length === 0 && (
              <p className="text-xs text-foreground-secondary">
                No custom headers. Click Add to include headers like Authorization.
              </p>
            )}
          </div>

          {/* Body Template */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Body Template
            </Label>
            <Textarea
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              placeholder='{"ref": "main", "environment": "production"}'
              disabled={bodyDisabled}
              className="h-24 resize-none border-border bg-background font-mono text-sm text-foreground placeholder:text-foreground-secondary/50 disabled:opacity-50"
            />
            {bodyDisabled && (
              <p className="text-xs text-foreground-secondary">
                {method} requests do not include a body.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-foreground-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!label.trim() || !url.trim() || isPending}
            className="bg-accent-blue text-white hover:bg-accent-blue/90"
          >
            {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
