import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, sponsorships } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSponsorshipDto } from './dto/create-sponsorship.dto';
import { UpdateSponsorshipDto } from './dto/update-sponsorship.dto';

interface SponsorshipRowWithContent extends sponsorships {
  content: { title: string } | null;
}

export interface SponsorshipResponse {
  id: string;
  userId: string;
  brand: string;
  amount: number;
  currency: string;
  status: string;
  contentId: string | null;
  contactInfo: string | null;
  notes: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  contentTitle: string | null;
}

function mapSponsorship(row: SponsorshipRowWithContent): SponsorshipResponse {
  return {
    id: row.id,
    userId: row.user_id,
    brand: row.brand,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    contentId: row.content_id,
    contactInfo: row.contact_info,
    notes: row.notes,
    dueDate: row.due_date ? row.due_date.toISOString() : null,
    paidAt: row.paid_at ? row.paid_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    contentTitle: row.content?.title ?? null,
  };
}

@Injectable()
export class SponsorshipsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    status?: string,
    contentId?: string,
    search?: string,
  ): Promise<SponsorshipResponse[]> {
    const where: Prisma.sponsorshipsWhereInput = {
      user_id: userId,
    };

    if (status) {
      where.status = status;
    }
    if (contentId) {
      where.content_id = contentId;
    }
    if (search) {
      where.brand = { contains: search };
    }

    const rows = await this.prisma.sponsorships.findMany({
      where,
      include: { content: { select: { title: true } } },
      orderBy: { created_at: 'desc' },
    });

    return rows.map(mapSponsorship);
  }

  async create(
    userId: string,
    dto: CreateSponsorshipDto,
  ): Promise<SponsorshipResponse> {
    const data: Prisma.sponsorshipsUncheckedCreateInput = {
      user_id: userId,
      brand: dto.brand,
      amount: dto.amount,
      currency: dto.currency ?? 'KRW',
      status: dto.status ?? 'negotiating',
      content_id: dto.contentId ?? null,
      contact_info: dto.contactInfo ?? null,
      notes: dto.notes ?? null,
      due_date: dto.dueDate ? new Date(dto.dueDate) : null,
    };

    const row = await this.prisma.sponsorships.create({
      data,
      include: { content: { select: { title: true } } },
    });

    return mapSponsorship(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateSponsorshipDto,
  ): Promise<SponsorshipResponse> {
    const existing = await this.prisma.sponsorships.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Sponsorship not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to update this sponsorship');
    }

    const data: Prisma.sponsorshipsUpdateInput = {};
    if (dto.brand !== undefined) data.brand = dto.brand;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.contactInfo !== undefined) data.contact_info = dto.contactInfo;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.dueDate !== undefined) {
      data.due_date = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.paidAt !== undefined) {
      data.paid_at = dto.paidAt ? new Date(dto.paidAt) : null;
    }
    if (dto.contentId !== undefined) {
      data.content = dto.contentId
        ? { connect: { id: dto.contentId } }
        : { disconnect: true };
    }

    const row = await this.prisma.sponsorships.update({
      where: { id },
      data,
      include: { content: { select: { title: true } } },
    });

    return mapSponsorship(row);
  }

  async getGlobalSummary(
    userId: string,
    year: number,
  ): Promise<{
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    paidCount: number;
    pendingCount: number;
    invoicedCount: number;
    monthlyBreakdown: Array<{ month: string; amount: number }>;
  }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const rows = await this.prisma.sponsorships.findMany({
      where: {
        user_id: userId,
        created_at: { gte: startDate, lt: endDate },
      },
      select: {
        amount: true,
        status: true,
        paid_at: true,
        created_at: true,
      },
    });

    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let invoicedCount = 0;
    const monthlyMap = new Map<string, number>();

    for (const row of rows) {
      const amount = Number(row.amount);
      totalAmount += amount;

      if (row.status === 'paid') {
        paidAmount += amount;
        paidCount++;
      } else if (row.status === 'pending' || row.status === 'negotiating') {
        pendingAmount += amount;
        pendingCount++;
      } else if (row.status === 'invoiced') {
        invoicedCount++;
        pendingAmount += amount;
      }

      const monthKey = row.paid_at
        ? `${row.paid_at.getFullYear()}-${String(row.paid_at.getMonth() + 1).padStart(2, '0')}`
        : `${row.created_at.getFullYear()}-${String(row.created_at.getMonth() + 1).padStart(2, '0')}`;

      if (row.status === 'paid') {
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + amount);
      }
    }

    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      paidCount,
      pendingCount,
      invoicedCount,
      monthlyBreakdown,
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.sponsorships.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Sponsorship not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this sponsorship');
    }

    await this.prisma.sponsorships.delete({ where: { id } });
  }
}
