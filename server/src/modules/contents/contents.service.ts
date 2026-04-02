import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, contents, content_checklists, content_stage_data } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UndoService } from '../undo/undo.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentFiltersDto } from './dto/content-filters.dto';
import { ReorderContentDto } from './dto/reorder-content.dto';
import { CreateContentChecklistDto } from './dto/create-content-checklist.dto';
import { UpdateContentChecklistDto } from './dto/update-content-checklist.dto';
import { UpsertStageDataDto } from './dto/upsert-stage-data.dto';

export interface ContentResponse {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  type: string;
  stage: string;
  platform: string;
  noteId: string | null;
  youtubeVideoId: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  templateId: string | null;
  tags: string[];
  position: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentChecklistResponse {
  id: string;
  contentId: string;
  stage: string;
  label: string;
  checked: boolean;
  position: number | null;
}

export interface ContentStageDataResponse {
  id: string;
  contentId: string;
  stage: string;
  description: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentWithDetailsResponse extends ContentResponse {
  projectName: string | null;
  projectColor: string | null;
  noteTitle: string | null;
  checklists: ContentChecklistResponse[];
  stageData: ContentStageDataResponse[];
}

interface ContentRowWithDetails extends contents {
  project: { id: string; name: string; color: string | null } | null;
  note: { id: string; title: string } | null;
  content_checklists: content_checklists[];
  content_stage_data: content_stage_data[];
}

function mapContent(row: contents): ContentResponse {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    title: row.title,
    type: row.type,
    stage: row.stage,
    platform: row.platform,
    noteId: row.note_id,
    youtubeVideoId: row.youtube_video_id,
    scheduledAt: row.scheduled_at?.toISOString() ?? null,
    publishedAt: row.published_at?.toISOString() ?? null,
    templateId: row.template_id,
    tags: row.tags ?? [],
    position: row.position,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapChecklist(row: content_checklists): ContentChecklistResponse {
  return {
    id: row.id,
    contentId: row.content_id,
    stage: row.stage,
    label: row.label,
    checked: row.checked,
    position: row.position,
  };
}

function mapStageData(row: content_stage_data): ContentStageDataResponse {
  return {
    id: row.id,
    contentId: row.content_id,
    stage: row.stage,
    description: row.description,
    completedAt: row.completed_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapContentWithDetails(
  row: ContentRowWithDetails,
): ContentWithDetailsResponse {
  return {
    ...mapContent(row),
    projectName: row.project?.name ?? null,
    projectColor: row.project?.color ?? null,
    noteTitle: row.note?.title ?? null,
    checklists: row.content_checklists.map(mapChecklist),
    stageData: row.content_stage_data.map(mapStageData),
  };
}

const CONTENT_INCLUDE = {
  project: { select: { id: true, name: true, color: true } },
  note: { select: { id: true, title: true } },
  content_checklists: {
    orderBy: { position: 'asc' },
  },
  content_stage_data: true,
} satisfies Prisma.contentsInclude;

@Injectable()
export class ContentsService {
  constructor(
    private prisma: PrismaService,
    private undoService: UndoService,
  ) {}

  async findAll(
    userId: string,
    filters: ContentFiltersDto,
  ): Promise<ContentWithDetailsResponse[]> {
    const where: Prisma.contentsWhereInput = {
      user_id: userId,
    };

    if (filters.stage) {
      where.stage = filters.stage;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.platform) {
      where.platform = filters.platform;
    }
    if (filters.projectId) {
      where.project_id = filters.projectId;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
      ];
    }

    const rows = await this.prisma.contents.findMany({
      where,
      include: CONTENT_INCLUDE,
      orderBy: [{ position: 'asc' }, { created_at: 'desc' }],
    });

    return rows.map(mapContentWithDetails);
  }

  async findOne(
    userId: string,
    id: string,
  ): Promise<ContentWithDetailsResponse> {
    const row = await this.prisma.contents.findUnique({
      where: { id },
      include: CONTENT_INCLUDE,
    });

    if (!row) {
      throw new NotFoundException('Content not found');
    }
    if (row.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this content');
    }

    return mapContentWithDetails(row);
  }

  async create(
    userId: string,
    dto: CreateContentDto,
  ): Promise<ContentWithDetailsResponse> {
    const stage = dto.stage ?? 'idea';

    const maxPos = await this.prisma.contents.aggregate({
      where: { user_id: userId, stage },
      _max: { position: true },
    });
    const nextPosition = (maxPos._max.position ?? -1) + 1;

    const row = await this.prisma.contents.create({
      data: {
        user_id: userId,
        title: dto.title,
        type: dto.type ?? 'video',
        stage,
        platform: dto.platform ?? 'youtube',
        project_id: dto.projectId ?? null,
        note_id: dto.noteId ?? null,
        template_id: dto.templateId ?? null,
        scheduled_at: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        tags: dto.tags ?? [],
        position: nextPosition,
        content_stage_data: {
          create: {
            stage,
            description: null,
          },
        },
      },
      include: CONTENT_INCLUDE,
    });

    this.undoService
      .recordChange(userId, 'contents', row.id, 'create', null, this.toRawData(row))
      .catch(() => {});

    return mapContentWithDetails(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateContentDto,
  ): Promise<ContentWithDetailsResponse> {
    const existing = await this.prisma.contents.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Content not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to update this content');
    }

    const data: Prisma.contentsUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.stage !== undefined) data.stage = dto.stage;
    if (dto.platform !== undefined) data.platform = dto.platform;
    if (dto.youtubeVideoId !== undefined)
      data.youtube_video_id = dto.youtubeVideoId;
    if (dto.tags !== undefined) data.tags = dto.tags;

    if (dto.scheduledAt !== undefined) {
      data.scheduled_at = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    }
    if (dto.publishedAt !== undefined) {
      data.published_at = dto.publishedAt ? new Date(dto.publishedAt) : null;
    }

    if (dto.projectId !== undefined) {
      data.project = dto.projectId
        ? { connect: { id: dto.projectId } }
        : { disconnect: true };
    }
    if (dto.noteId !== undefined) {
      data.note = dto.noteId
        ? { connect: { id: dto.noteId } }
        : { disconnect: true };
    }
    if (dto.templateId !== undefined) {
      data.template = dto.templateId
        ? { connect: { id: dto.templateId } }
        : { disconnect: true };
    }

    data.updated_at = new Date();

    const row = await this.prisma.contents.update({
      where: { id },
      data,
      include: CONTENT_INCLUDE,
    });

    this.undoService
      .recordChange(userId, 'contents', id, 'update', this.toRawData(existing), this.toRawData(row))
      .catch(() => {});

    return mapContentWithDetails(row);
  }

  async reorder(
    userId: string,
    dto: ReorderContentDto,
  ): Promise<{ updated: number }> {
    const ids = dto.items.map((item) => item.id);

    const existing = await this.prisma.contents.findMany({
      where: { id: { in: ids }, user_id: userId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((r) => r.id));

    const validItems = dto.items.filter((item) => existingIds.has(item.id));

    if (validItems.length === 0) {
      return { updated: 0 };
    }

    await this.prisma.$transaction(
      validItems.map((item) =>
        this.prisma.contents.update({
          where: { id: item.id },
          data: { stage: item.stage, position: item.position },
        }),
      ),
    );

    return { updated: validItems.length };
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.contents.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Content not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this content');
    }

    await this.prisma.contents.delete({ where: { id } });

    this.undoService
      .recordChange(userId, 'contents', id, 'delete', this.toRawData(existing), null)
      .catch(() => {});
  }

  private toRawData(row: any): Record<string, unknown> {
    const { project, note, content_checklists, content_stage_data, ...data } = row;
    return data;
  }

  // --- Stage Data ---

  async findStageData(
    userId: string,
    contentId: string,
  ): Promise<ContentStageDataResponse[]> {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }
    if (content.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this content');
    }

    const rows = await this.prisma.content_stage_data.findMany({
      where: { content_id: contentId },
    });

    return rows.map(mapStageData);
  }

  async upsertStageData(
    userId: string,
    contentId: string,
    stage: string,
    dto: UpsertStageDataDto,
  ): Promise<ContentStageDataResponse> {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }
    if (content.user_id !== userId) {
      throw new ForbiddenException('Not allowed to modify this content');
    }

    const row = await this.prisma.content_stage_data.upsert({
      where: {
        content_id_stage: { content_id: contentId, stage },
      },
      create: {
        content_id: contentId,
        stage,
        description: dto.description ?? null,
      },
      update: {
        description: dto.description ?? null,
        updated_at: new Date(),
      },
    });

    return mapStageData(row);
  }

  // --- Checklists ---

  async findChecklists(
    userId: string,
    contentId: string,
  ): Promise<ContentChecklistResponse[]> {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }
    if (content.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this content');
    }

    const rows = await this.prisma.content_checklists.findMany({
      where: { content_id: contentId },
      orderBy: { position: 'asc' },
    });

    return rows.map(mapChecklist);
  }

  async createChecklist(
    userId: string,
    contentId: string,
    dto: CreateContentChecklistDto,
  ): Promise<ContentChecklistResponse> {
    const content = await this.prisma.contents.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }
    if (content.user_id !== userId) {
      throw new ForbiddenException('Not allowed to modify this content');
    }

    const row = await this.prisma.content_checklists.create({
      data: {
        content_id: contentId,
        stage: dto.stage ?? 'idea',
        label: dto.label,
        position: dto.position ?? null,
      },
    });

    return mapChecklist(row);
  }

  async updateChecklist(
    userId: string,
    checklistId: string,
    dto: UpdateContentChecklistDto,
  ): Promise<ContentChecklistResponse> {
    const existing = await this.prisma.content_checklists.findUnique({
      where: { id: checklistId },
      include: { content: { select: { user_id: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Checklist item not found');
    }
    if (existing.content.user_id !== userId) {
      throw new ForbiddenException('Not allowed to modify this checklist item');
    }

    const data: Prisma.content_checklistsUpdateInput = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.checked !== undefined) data.checked = dto.checked;
    if (dto.position !== undefined) data.position = dto.position;

    const row = await this.prisma.content_checklists.update({
      where: { id: checklistId },
      data,
    });

    return mapChecklist(row);
  }

  async removeChecklist(userId: string, checklistId: string): Promise<void> {
    const existing = await this.prisma.content_checklists.findUnique({
      where: { id: checklistId },
      include: { content: { select: { user_id: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Checklist item not found');
    }
    if (existing.content.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this checklist item');
    }

    await this.prisma.content_checklists.delete({
      where: { id: checklistId },
    });
  }
}
