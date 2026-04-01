import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UndoService } from '../undo/undo.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

export interface LinkResponse {
  id: string;
  userId: string;
  projectId: string | null;
  label: string;
  url: string;
  category: string | null;
  clickCount: number;
  position: number | null;
  createdAt: string;
}

function mapLink(row: Prisma.linksGetPayload<object>): LinkResponse {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    label: row.label,
    url: row.url,
    category: row.category,
    clickCount: row.click_count,
    position: row.position,
    createdAt: row.created_at.toISOString(),
  };
}

@Injectable()
export class LinksService {
  constructor(
    private prisma: PrismaService,
    private undoService: UndoService,
  ) {}

  async findAll(userId: string, category?: string, projectId?: string): Promise<LinkResponse[]> {
    const where: Prisma.linksWhereInput = { user_id: userId };

    if (category !== undefined) {
      where.category = category;
    }
    if (projectId !== undefined) {
      where.project_id = projectId;
    }

    const rows = await this.prisma.links.findMany({
      where,
      orderBy: [
        { position: 'asc' },
        { created_at: 'desc' },
      ],
    });

    return rows.map(mapLink);
  }

  async create(userId: string, dto: CreateLinkDto): Promise<LinkResponse> {
    const row = await this.prisma.links.create({
      data: {
        user_id: userId,
        label: dto.label,
        url: dto.url,
        category: dto.category ?? null,
        position: dto.position ?? null,
        project_id: dto.projectId ?? null,
      },
    });

    this.undoService
      .recordChange(userId, 'links', row.id, 'create', null, this.toRawData(row))
      .catch(() => {});

    return mapLink(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateLinkDto,
  ): Promise<LinkResponse> {
    const existing = await this.prisma.links.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Link not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to update this link');
    }

    const data: Prisma.linksUpdateInput = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.projectId !== undefined) {
      data.project = dto.projectId
        ? { connect: { id: dto.projectId } }
        : { disconnect: true };
    }

    const row = await this.prisma.links.update({
      where: { id },
      data,
    });

    this.undoService
      .recordChange(userId, 'links', id, 'update', this.toRawData(existing), this.toRawData(row))
      .catch(() => {});

    return mapLink(row);
  }

  async incrementClick(userId: string, id: string): Promise<LinkResponse> {
    const existing = await this.prisma.links.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Link not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this link');
    }

    const row = await this.prisma.links.update({
      where: { id },
      data: { click_count: { increment: 1 } },
    });

    return mapLink(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.links.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Link not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this link');
    }

    await this.prisma.links.delete({ where: { id } });

    this.undoService
      .recordChange(userId, 'links', id, 'delete', this.toRawData(existing), null)
      .catch(() => {});
  }

  private toRawData(row: any): Record<string, unknown> {
    return { ...row };
  }
}
