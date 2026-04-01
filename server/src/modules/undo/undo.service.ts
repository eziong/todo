import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface ChangeEntry {
  id: string;
  userId: string;
  tableName: string;
  recordId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

@Injectable()
export class UndoService {
  private readonly logger = new Logger(UndoService.name);

  // Track undo pointer per user (in-memory, resets on restart)
  private undoPointers = new Map<string, number>();

  constructor(private prisma: PrismaService) {}

  async recordChange(
    userId: string,
    tableName: string,
    recordId: string,
    action: 'create' | 'update' | 'delete',
    before?: Record<string, unknown> | null,
    after?: Record<string, unknown> | null,
  ): Promise<void> {
    await this.prisma.change_history.create({
      data: {
        user_id: userId,
        table_name: tableName,
        record_id: recordId,
        action,
        before: (before ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        after: (after ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });

    // Reset undo pointer when new change is recorded (clears redo stack)
    this.undoPointers.delete(userId);
  }

  async undo(userId: string): Promise<{ undone: ChangeEntry } | null> {
    const changes = await this.prisma.change_history.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    if (changes.length === 0) return null;

    const pointer = this.undoPointers.get(userId) ?? 0;

    if (pointer >= changes.length) return null;

    const change = changes[pointer];

    try {
      await this.applyUndo(
        change.table_name,
        change.record_id,
        change.action,
        change.before as Record<string, unknown> | null,
      );
    } catch (e) {
      this.logger.warn(
        `Undo failed for ${change.table_name}/${change.record_id}: ${e}`,
      );
      throw e;
    }

    this.undoPointers.set(userId, pointer + 1);

    return {
      undone: this.mapChange(change),
    };
  }

  async redo(userId: string): Promise<{ redone: ChangeEntry } | null> {
    const pointer = this.undoPointers.get(userId) ?? 0;

    if (pointer <= 0) return null;

    const changes = await this.prisma.change_history.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    const newPointer = pointer - 1;
    const change = changes[newPointer];

    if (!change) return null;

    try {
      await this.applyRedo(
        change.table_name,
        change.record_id,
        change.action,
        change.after as Record<string, unknown> | null,
      );
    } catch (e) {
      this.logger.warn(
        `Redo failed for ${change.table_name}/${change.record_id}: ${e}`,
      );
      throw e;
    }

    this.undoPointers.set(userId, newPointer);

    return {
      redone: this.mapChange(change),
    };
  }

  async getHistory(userId: string, limit = 50): Promise<ChangeEntry[]> {
    const rows = await this.prisma.change_history.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return rows.map((r) => this.mapChange(r));
  }

  private mapChange(r: {
    id: string;
    user_id: string;
    table_name: string;
    record_id: string;
    action: string;
    before: unknown;
    after: unknown;
    created_at: Date;
  }): ChangeEntry {
    return {
      id: r.id,
      userId: r.user_id,
      tableName: r.table_name,
      recordId: r.record_id,
      action: r.action,
      before: r.before as Record<string, unknown> | null,
      after: r.after as Record<string, unknown> | null,
      createdAt: r.created_at.toISOString(),
    };
  }

  private async applyUndo(
    tableName: string,
    recordId: string,
    action: string,
    before: Record<string, unknown> | null,
  ): Promise<void> {
    const model = this.getModel(tableName);
    if (!model) throw new Error(`Unknown table: ${tableName}`);

    switch (action) {
      case 'create':
        // Undo create = delete the record
        await (model as any)
          .delete({ where: { id: recordId } })
          .catch(() => {
            this.logger.warn(
              `Record ${tableName}/${recordId} already deleted`,
            );
          });
        break;

      case 'update':
        // Undo update = restore 'before' data
        if (!before) throw new Error('Cannot undo update without before data');
        await (model as any).update({
          where: { id: recordId },
          data: before,
        });
        break;

      case 'delete':
        // Undo delete = re-create with 'before' data
        if (!before) throw new Error('Cannot undo delete without before data');
        await (model as any).create({
          data: { ...before, id: recordId },
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async applyRedo(
    tableName: string,
    recordId: string,
    action: string,
    after: Record<string, unknown> | null,
  ): Promise<void> {
    const model = this.getModel(tableName);
    if (!model) throw new Error(`Unknown table: ${tableName}`);

    switch (action) {
      case 'create':
        // Redo create = re-create the record
        if (!after) throw new Error('Cannot redo create without after data');
        await (model as any).create({
          data: { ...after, id: recordId },
        });
        break;

      case 'update':
        // Redo update = apply 'after' data
        if (!after) throw new Error('Cannot redo update without after data');
        await (model as any).update({
          where: { id: recordId },
          data: after,
        });
        break;

      case 'delete':
        // Redo delete = delete again
        await (model as any)
          .delete({ where: { id: recordId } })
          .catch(() => {
            this.logger.warn(
              `Record ${tableName}/${recordId} already deleted`,
            );
          });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private getModel(tableName: string): unknown {
    const map: Record<string, unknown> = {
      todos: this.prisma.todos,
      projects: this.prisma.projects,
      notes: this.prisma.notes,
      contents: this.prisma.contents,
      links: this.prisma.links,
    };
    return map[tableName] ?? null;
  }
}
