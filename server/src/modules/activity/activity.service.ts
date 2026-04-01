import { Injectable } from '@nestjs/common';
import { Prisma, activity_log } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface ActivityLogResponse {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function mapActivityLog(row: activity_log): ActivityLogResponse {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.created_at.toISOString(),
  };
}

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async create(input: {
    userId: string;
    action: 'created' | 'completed' | 'moved' | 'built' | 'deleted';
    entityType: 'todo' | 'build' | 'project';
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.activity_log.create({
      data: {
        user_id: input.userId,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findRecent(
    userId: string,
    limit: number = 10,
  ): Promise<ActivityLogResponse[]> {
    const rows = await this.prisma.activity_log.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return rows.map(mapActivityLog);
  }
}
