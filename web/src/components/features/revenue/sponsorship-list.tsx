import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SponsorshipWithContent, SponsorshipStatus } from '@/types/domain'
import type { SponsorshipId } from '@/types/branded'

interface SponsorshipListProps {
  sponsorships: SponsorshipWithContent[]
  onEdit: (sponsorship: SponsorshipWithContent) => void
  onDelete: (id: SponsorshipId) => void
  onStatusChange: (id: SponsorshipId, status: SponsorshipStatus) => void
}

const STATUS_CONFIG: Record<SponsorshipStatus, { label: string; className: string }> = {
  negotiating: { label: 'Negotiating', className: 'bg-accent-yellow/10 text-accent-yellow' },
  confirmed: { label: 'Confirmed', className: 'bg-accent-blue/10 text-accent-blue' },
  delivered: { label: 'Delivered', className: 'bg-accent-purple/10 text-accent-purple' },
  paid: { label: 'Paid', className: 'bg-accent-green/10 text-accent-green' },
  cancelled: { label: 'Cancelled', className: 'bg-accent-red/10 text-accent-red' },
}

const STATUS_TRANSITIONS: Record<SponsorshipStatus, SponsorshipStatus[]> = {
  negotiating: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: ['paid'],
  paid: [],
  cancelled: [],
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function SponsorshipList({
  sponsorships,
  onEdit,
  onDelete,
  onStatusChange,
}: SponsorshipListProps) {
  if (sponsorships.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-foreground-secondary">
        No sponsorships yet. Add your first sponsorship deal.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-foreground-secondary">
            <th className="pb-3 pr-4 font-medium">Brand</th>
            <th className="pb-3 pr-4 font-medium">Amount</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Content</th>
            <th className="pb-3 pr-4 font-medium">Due Date</th>
            <th className="pb-3 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody>
          {sponsorships.map((sponsorship) => {
            const statusConfig = STATUS_CONFIG[sponsorship.status]
            const transitions = STATUS_TRANSITIONS[sponsorship.status]

            return (
              <tr
                key={sponsorship.id as string}
                className="border-b border-border last:border-0"
              >
                <td className="py-3 pr-4">
                  <span className="font-medium text-foreground">{sponsorship.brand}</span>
                </td>
                <td className="py-3 pr-4 text-foreground">
                  {formatCurrency(sponsorship.amount, sponsorship.currency)}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      statusConfig.className
                    )}
                  >
                    {statusConfig.label}
                  </span>
                </td>
                <td className="py-3 pr-4 text-foreground-secondary">
                  {sponsorship.contentTitle ?? '-'}
                </td>
                <td className="py-3 pr-4 text-foreground-secondary">
                  {formatDate(sponsorship.dueDate)}
                </td>
                <td className="py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(sponsorship)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {transitions.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onStatusChange(sponsorship.id, status)}
                        >
                          <span
                            className={cn(
                              'mr-2 inline-block h-2 w-2 rounded-full',
                              STATUS_CONFIG[status].className.replace(/\/10/g, '')
                            )}
                          />
                          Mark as {STATUS_CONFIG[status].label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        onClick={() => onDelete(sponsorship.id)}
                        className="text-accent-red focus:text-accent-red"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
