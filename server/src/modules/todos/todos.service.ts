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
import { MoveTodoDto } from './dto/move-todo.dto';
import { generatePositionBetween, generateEndPosition } from '../../common/utils/position';

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
  position: string | null;
  completedAt: string | null;
  contentId: string | null;
  contentStage: string | null;
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
    contentId: row.content_id,
    contentStage: row.content_stage,
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
    contentId: row.content_id,
    contentStage: row.content_stage,
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
    };

    // When filtering by contentId, show all linked todos (including subtasks).
    // Otherwise, default to top-level todos only.
    if (filters.contentId) {
      where.content_id = filters.contentId;
      if (filters.contentStage) {
        where.content_stage = filters.contentStage;
      }
    } else {
      where.parent_id = null;
    }

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
    let position = dto.position ?? null;

    // Auto-assign end position for content-linked todos
    if (!position && dto.contentId && dto.contentStage) {
      const last = await this.prisma.todos.findFirst({
        where: {
          user_id: userId,
          content_id: dto.contentId,
          content_stage: dto.contentStage,
        },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      position = generateEndPosition(last?.position ?? null);
    }

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
        position,
        content_id: dto.contentId ?? null,
        content_stage: dto.contentStage ?? null,
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
    if (dto.contentId !== undefined) {
      data.content = dto.contentId
        ? { connect: { id: dto.contentId } }
        : { disconnect: true };
    }
    if (dto.contentStage !== undefined) {
      data.content_stage = dto.contentStage;
    }

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

  async moveTodo(
    userId: string,
    dto: MoveTodoDto,
  ): Promise<TodoResponse> {
    const todo = await this.prisma.todos.findUnique({
      where: { id: dto.id },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }
    if (todo.user_id !== userId) {
      throw new ForbiddenException('Not allowed to move this todo');
    }

    let prevPos: string | null = null;
    let nextPos: string | null = null;

    if (dto.afterId) {
      const after = await this.prisma.todos.findUnique({
        where: { id: dto.afterId },
        select: { position: true },
      });
      prevPos = after?.position ?? null;
    }

    if (dto.beforeId) {
      const before = await this.prisma.todos.findUnique({
        where: { id: dto.beforeId },
        select: { position: true },
      });
      nextPos = before?.position ?? null;
    }

    const newPosition = generatePositionBetween(prevPos, nextPos);

    const row = await this.prisma.todos.update({
      where: { id: dto.id },
      data: { position: newPosition },
      include: { project: { select: { id: true, name: true, color: true } } },
    });

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
    const { project, content, ...data } = row;
    return data;
  }
}
