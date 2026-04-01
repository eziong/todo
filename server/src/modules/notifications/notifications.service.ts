import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotificationResponse {
  id: string;
  userId: string;
  source: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
}

function mapNotification(
  row: Prisma.notificationsGetPayload<object>,
): NotificationResponse {
  return {
    id: row.id,
    userId: row.user_id,
    source: row.source,
    type: row.type,
    title: row.title,
    body: row.body,
    url: row.url,
    entityId: row.entity_id,
    read: row.read,
    createdAt: row.created_at.toISOString(),
  };
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(input: {
    userId: string;
    source: 'youtube' | 'build' | 'system';
    type: string;
    title: string;
    body?: string | null;
    url?: string | null;
    entityId?: string | null;
  }): Promise<void> {
    await this.prisma.notifications.create({
      data: {
        user_id: input.userId,
        source: input.source,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        url: input.url ?? null,
        entity_id: input.entityId ?? null,
      },
    });
  }

  async findAll(
    userId: string,
    source?: string,
  ): Promise<NotificationResponse[]> {
    const where: Prisma.notificationsWhereInput = {
      user_id: userId,
    };

    if (source) {
      where.source = source;
    }

    const rows = await this.prisma.notifications.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return rows.map(mapNotification);
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notifications.count({
      where: { user_id: userId, read: false },
    });

    return { count };
  }

  async markRead(
    userId: string,
    id: string,
  ): Promise<NotificationResponse> {
    const existing = await this.prisma.notifications.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to update this notification');
    }

    const row = await this.prisma.notifications.update({
      where: { id },
      data: { read: true },
    });

    return mapNotification(row);
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notifications.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    });

    return { count: result.count };
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.notifications.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this notification');
    }

    await this.prisma.notifications.delete({ where: { id } });
  }
}
