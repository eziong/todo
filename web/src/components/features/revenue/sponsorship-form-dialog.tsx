"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  SponsorshipWithContent,
  CreateSponsorshipInput,
  UpdateSponsorshipInput,
  SponsorshipStatus,
  Content,
} from "@/types/domain"

interface SponsorshipFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sponsorship?: SponsorshipWithContent | null
  contents: Pick<Content, 'id' | 'title'>[]
  onSubmit: (input: CreateSponsorshipInput | UpdateSponsorshipInput) => void
  isPending: boolean
}

const STATUS_OPTIONS: { value: SponsorshipStatus; label: string }[] = [
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
]

const CURRENCY_OPTIONS = [
  { value: 'KRW', label: 'KRW' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'JPY', label: 'JPY' },
]

export function SponsorshipFormDialog({
  open,
  onOpenChange,
  sponsorship,
  contents,
  onSubmit,
  isPending,
}: SponsorshipFormDialogProps) {
  const isEditing = Boolean(sponsorship)

  const [brand, setBrand] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("KRW")
  const [status, setStatus] = useState<SponsorshipStatus>("negotiating")
  const [contentId, setContentId] = useState<string>("")
  const [contactInfo, setContactInfo] = useState("")
  const [notes, setNotes] = useState("")
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    if (open) {
      if (sponsorship) {
        setBrand(sponsorship.brand)
        setAmount(String(sponsorship.amount))
        setCurrency(sponsorship.currency)
        setStatus(sponsorship.status)
        setContentId((sponsorship.contentId as string) ?? "")
        setContactInfo(sponsorship.contactInfo ?? "")
        setNotes(sponsorship.notes ?? "")
        setDueDate(sponsorship.dueDate ?? "")
      } else {
        setBrand("")
        setAmount("")
        setCurrency("KRW")
        setStatus("negotiating")
        setContentId("")
        setContactInfo("")
        setNotes("")
        setDueDate("")
      }
    }
  }, [open, sponsorship])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedBrand = brand.trim()
    const parsedAmount = parseFloat(amount)
    if (!trimmedBrand || isNaN(parsedAmount) || parsedAmount <= 0) return

    onSubmit({
      brand: trimmedBrand,
      amount: parsedAmount,
      currency,
      status,
      contentId: contentId || undefined,
      contactInfo: contactInfo.trim() || undefined,
      notes: notes.trim() || undefined,
      dueDate: dueDate || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background-secondary sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditing ? "Edit Sponsorship" : "New Sponsorship"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="sp-brand" className="text-foreground-secondary">
                Brand
              </Label>
              <Input
                id="sp-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brand name"
                autoFocus
                className="border-border bg-background text-foreground placeholder:text-foreground-secondary/60"
              />
            </div>

            {/* Amount + Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="sp-amount" className="text-foreground-secondary">
                  Amount
                </Label>
                <Input
                  id="sp-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="border-border bg-background text-foreground placeholder:text-foreground-secondary/60"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground-secondary">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="border-border bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-foreground-secondary">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SponsorshipStatus)}>
                <SelectTrigger className="border-border bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label className="text-foreground-secondary">Linked Content</Label>
              <Select value={contentId} onValueChange={setContentId}>
                <SelectTrigger className="border-border bg-background text-foreground">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contents.map((c) => (
                    <SelectItem key={c.id as string} value={c.id as string}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <Label htmlFor="sp-contact" className="text-foreground-secondary">
                Contact Info
              </Label>
              <Input
                id="sp-contact"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Email or contact details"
                className="border-border bg-background text-foreground placeholder:text-foreground-secondary/60"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="sp-due" className="text-foreground-secondary">
                Due Date
              </Label>
              <Input
                id="sp-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border-border bg-background text-foreground"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="sp-notes" className="text-foreground-secondary">
                Notes
              </Label>
              <Textarea
                id="sp-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={3}
                className="border-border bg-background text-foreground placeholder:text-foreground-secondary/60"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-foreground-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!brand.trim() || !amount || isPending}
              className="bg-accent-blue text-white hover:bg-accent-blue/90"
            >
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
