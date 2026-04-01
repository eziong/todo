import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { UndoService } from '../undo/undo.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export interface ProjectResponse {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  archived: boolean;
  position: number | null;
  githubRepo: string | null;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithStatsResponse extends ProjectResponse {
  todoCount: number;
  completedCount: number;
}

function mapProject(row: Prisma.projectsGetPayload<object>): ProjectResponse {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    archived: row.archived,
    position: row.position,
    githubRepo: row.github_repo,
    features: row.features ?? [],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private undoService: UndoService,
  ) {}

  async findAll(
    userId: string,
    archived?: string,
  ): Promise<ProjectWithStatsResponse[]> {
    const where: Prisma.projectsWhereInput = { user_id: userId };

    if (archived !== undefined) {
      where.archived = archived === 'true';
    }

    const rows = await this.prisma.projects.findMany({
      where,
      include: {
        todos: { select: { id: true, status: true } },
      },
      orderBy: [
        { position: 'asc' },
        { created_at: 'desc' },
      ],
    });

    return rows.map((row) => {
      const todos = row.todos ?? [];
      return {
        ...mapProject(row),
        todoCount: todos.filter((t) => t.status !== 'completed').length,
        completedCount: todos.filter((t) => t.status === 'completed').length,
      };
    });
  }

  async findOne(userId: string, id: string): Promise<ProjectResponse> {
    const row = await this.prisma.projects.findUnique({ where: { id } });

    if (!row) {
      throw new NotFoundException('Project not found');
    }
    if (row.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this project');
    }

    return mapProject(row);
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectResponse> {
    const row = await this.prisma.projects.create({
      data: {
        user_id: userId,
        name: dto.name,
        description: dto.description ?? null,
        color: dto.color ?? null,
        icon: dto.icon ?? null,
        github_repo: dto.githubRepo ?? null,
        features: dto.features ?? ['tasks', 'ideas', 'notes', 'links'],
      },
    });

    this.undoService
      .recordChange(userId, 'projects', row.id, 'create', null, this.toRawData(row))
      .catch(() => {});

    this.activityService
      .create({
        userId,
        action: 'created',
        entityType: 'project',
        entityId: row.id,
        metadata: { name: row.name },
      })
      .catch(() => {});

    return mapProject(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    const existing = await this.prisma.projects.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to update this project');
    }

    const data: Prisma.projectsUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.archived !== undefined) data.archived = dto.archived;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.githubRepo !== undefined) data.github_repo = dto.githubRepo;
    if (dto.features !== undefined) data.features = dto.features;

    const row = await this.prisma.projects.update({
      where: { id },
      data,
    });

    this.undoService
      .recordChange(userId, 'projects', id, 'update', this.toRawData(existing), this.toRawData(row))
      .catch(() => {});

    return mapProject(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.projects.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this project');
    }

    this.activityService
      .create({
        userId,
        action: 'deleted',
        entityType: 'project',
        entityId: id,
        metadata: { name: existing.name },
      })
      .catch(() => {});

    await this.prisma.projects.delete({ where: { id } });

    this.undoService
      .recordChange(userId, 'projects', id, 'delete', this.toRawData(existing), null)
      .catch(() => {});
  }

  private toRawData(row: any): Record<string, unknown> {
    const { todos, ...data } = row;
    return data;
  }
}
