import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { tags } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

export interface TagResponse {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: string;
}

function mapTag(row: tags): TagResponse {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at.toISOString(),
  };
}

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<TagResponse[]> {
    const rows = await this.prisma.tags.findMany({
      where: { user_id: userId },
      orderBy: { name: 'asc' },
    });

    return rows.map(mapTag);
  }

  async create(userId: string, dto: CreateTagDto): Promise<TagResponse> {
    const row = await this.prisma.tags.create({
      data: {
        user_id: userId,
        name: dto.name,
        color: dto.color ?? null,
      },
    });

    return mapTag(row);
  }

  async findByTodoId(
    userId: string,
    todoId: string,
  ): Promise<TagResponse[]> {
    const rows = await this.prisma.todo_tags.findMany({
      where: {
        todo_id: todoId,
        tag: { user_id: userId },
      },
      include: { tag: true },
      orderBy: { tag: { name: 'asc' } },
    });

    return rows.map((row) => mapTag(row.tag));
  }

  async remove(userId: string, id: string): Promise<void> {
    const tag = await this.prisma.tags.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (tag.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this tag');
    }

    await this.prisma.tags.delete({
      where: { id },
    });
  }
}
