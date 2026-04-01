import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { inbox_items } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInboxItemDto } from './dto/create-inbox-item.dto';
import { ProcessInboxItemDto } from './dto/process-inbox-item.dto';

export interface InboxItemResponse {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  processed: boolean;
  processedTo: string | null;
  processedId: string | null;
}

function mapInboxItem(row: inbox_items): InboxItemResponse {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at.toISOString(),
    processed: row.processed,
    processedTo: row.processed_to,
    processedId: row.processed_id,
  };
}

@Injectable()
export class InboxService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    processed?: string,
  ): Promise<InboxItemResponse[]> {
    const where: { user_id: string; processed?: boolean } = {
      user_id: userId,
    };

    if (processed !== undefined) {
      where.processed = processed === 'true';
    }

    const rows = await this.prisma.inbox_items.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return rows.map(mapInboxItem);
  }

  async create(
    userId: string,
    dto: CreateInboxItemDto,
  ): Promise<InboxItemResponse> {
    const row = await this.prisma.inbox_items.create({
      data: {
        user_id: userId,
        content: dto.content,
      },
    });

    return mapInboxItem(row);
  }

  async process(
    userId: string,
    id: string,
    dto: ProcessInboxItemDto,
  ): Promise<{ inboxItem: InboxItemResponse; todoId?: string }> {
    const existing = await this.prisma.inbox_items.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Inbox item not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to process this inbox item');
    }

    if (dto.processedTo === 'todo') {
      // Interactive transaction: create todo + mark inbox item processed atomically
      const result = await this.prisma.$transaction(async (tx) => {
        const todo = await tx.todos.create({
          data: {
            user_id: userId,
            title: dto.title ?? existing.content,
            project_id: dto.projectId ?? null,
          },
        });

        const updated = await tx.inbox_items.update({
          where: { id },
          data: {
            processed: true,
            processed_to: 'todo',
            processed_id: todo.id,
          },
        });

        return { todo, updated };
      });

      return {
        inboxItem: mapInboxItem(result.updated),
        todoId: result.todo.id,
      };
    }

    // processedTo is only 'todo' now, so this branch shouldn't be reached
    throw new Error('Unsupported processedTo value');
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.inbox_items.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Inbox item not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this inbox item');
    }

    await this.prisma.inbox_items.delete({ where: { id } });
  }
}
