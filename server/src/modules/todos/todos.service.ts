import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, todos } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { UndoService } from '../undo/undo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoFiltersDto } from './dto/todo-filters.dto';

// Row with joined project (partial select)
interface TodoRowWithProject extends todos {
  project: { id: string; name: string; color: string | null } | null;
}

export interface TodoProjectResponse {
  id: string;
  name: string;
  color: string | null;
}

export interface TodoResponse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string | null;
  parentId: string | null;
  position: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project: TodoProjectResponse | null;
}

function mapTodo(row: TodoRowWithProject): TodoResponse {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date?.toISOString().split('T')[0] ?? null,
    projectId: row.project_id,
    parentId: row.parent_id,
    position: row.position,
    completedAt: row.completed_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    project: row.project
      ? { id: row.project.id, name: row.project.name, color: row.project.color }
      : null,
  };
}

function mapTodoPlain(row: todos): Omit<TodoResponse, 'project'> {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date?.toISOString().split('T')[0] ?? null,
    projectId: row.project_id,
    parentId: row.parent_id,
    position: row.position,
    completedAt: row.completed_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

@Injectable()
export class TodosService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private undoService: UndoService,
  ) {}

  async findAll(userId: string, filters: TodoFiltersDto): Promise<TodoResponse[]> {
    const where: Prisma.todosWhereInput = {
      user_id: userId,
      parent_id: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.projectId) {
      where.project_id = filters.projectId;
    }
    if (filters.search) {
      where.title = { contains: filters.search };
    }

    const rows = await this.prisma.todos.findMany({
      where,
      include: { project: { select: { id: true, name: true, color: true } } },
      orderBy: [
        { position: 'asc' },
        { created_at: 'desc' },
      ],
    });

    return rows.map(mapTodo);
  }

  async findOne(userId: string, id: string): Promise<TodoResponse> {
    const row = await this.prisma.todos.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true, color: true } } },
    });

    if (!row) {
      throw new NotFoundException('Todo not found');
    }
    if (row.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this todo');
    }

    return mapTodo(row);
  }

  async findSubtasks(userId: string, parentId: string): Promise<Omit<TodoResponse, 'project'>[]> {
    // Verify parent exists and belongs to user
    const parent = await this.prisma.todos.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException('Parent todo not found');
    }
    if (parent.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this todo');
    }

    const rows = await this.prisma.todos.findMany({
      where: { parent_id: parentId, user_id: userId },
      orderBy: [
        { position: 'asc' },
        { created_at: 'asc' },
      ],
    });

    return rows.map(mapTodoPlain);
  }

  async create(userId: string, dto: CreateTodoDto): Promise<TodoResponse> {
    const row = await this.prisma.todos.create({
      data: {
        user_id: userId,
        title: dto.title,
        description: dto.description ?? null,
        status: dto.status ?? 'todo',
        priority: dto.priority ?? 'none',
        due_date: dto.dueDate ? new Date(dto.dueDate) : null,
        project_id: dto.projectId ?? null,
        parent_id: dto.parentId ?? null,
        position: dto.position ?? null,
      },
      include: { project: { select: { id: true, name: true, color: true } } },
    });

    this.undoService
      .recordChange(userId, 'todos', row.id, 'create', null, this.toRawData(row))
      .catch(() => {});

    this.activityService
      .create({
        userId,
        action: 'created',
        entityType: 'todo',
        entityId: row.id,
        metadata: { title: row.title },
      })
      .catch(() => {});

    return mapTodo(row);
  }

  async update(userId: string, id: string, dto: UpdateTodoDto): Promise<TodoResponse> {
    const existing = await this.prisma.todos.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Todo not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to update this todo');
    }

    const data: Prisma.todosUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) {
      data.status = dto.status;
      data.completed_at = dto.status === 'completed' ? new Date() : null;
    }
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueDate !== undefined) {
      data.due_date = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.projectId !== undefined) {
      data.project = dto.projectId
        ? { connect: { id: dto.projectId } }
        : { disconnect: true };
    }
    if (dto.position !== undefined) data.position = dto.position;

    const row = await this.prisma.todos.update({
      where: { id },
      data,
      include: { project: { select: { id: true, name: true, color: true } } },
    });

    this.undoService
      .recordChange(userId, 'todos', id, 'update', this.toRawData(existing), this.toRawData(row))
      .catch(() => {});

    if (dto.status === 'completed') {
      this.activityService
        .create({
          userId,
          action: 'completed',
          entityType: 'todo',
          entityId: id,
          metadata: { title: row.title },
        })
        .catch(() => {});
    }

    return mapTodo(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.todos.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Todo not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this todo');
    }

    this.activityService
      .create({
        userId,
        action: 'deleted',
        entityType: 'todo',
        entityId: id,
        metadata: { title: existing.title },
      })
      .catch(() => {});

    await this.prisma.todos.delete({ where: { id } });

    this.undoService
      .recordChange(userId, 'todos', id, 'delete', this.toRawData(existing), null)
      .catch(() => {});
  }

  private toRawData(row: any): Record<string, unknown> {
    const { project, ...data } = row;
    return data;
  }
}
