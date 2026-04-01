import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, notes } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UndoService } from '../undo/undo.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteFiltersDto } from './dto/note-filters.dto';

interface NoteRowWithFolder extends notes {
  folder: { id: string; name: string } | null;
}

export interface NoteResponse {
  id: string;
  userId: string;
  folderId: string | null;
  projectId: string | null;
  title: string;
  content: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteWithFolderResponse extends NoteResponse {
  folderName: string | null;
}

function mapNote(row: NoteRowWithFolder): NoteWithFolderResponse {
  return {
    id: row.id,
    userId: row.user_id,
    folderId: row.folder_id,
    projectId: row.project_id,
    title: row.title,
    content: row.content,
    pinned: row.pinned,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    folderName: row.folder?.name ?? null,
  };
}

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private undoService: UndoService,
  ) {}

  async findAll(
    userId: string,
    filters: NoteFiltersDto,
  ): Promise<NoteWithFolderResponse[]> {
    const where: Prisma.notesWhereInput = {
      user_id: userId,
    };

    if (filters.folderId) {
      where.folder_id = filters.folderId;
    }
    if (filters.projectId) {
      where.project_id = filters.projectId;
    }
    if (filters.pinned !== undefined) {
      where.pinned = filters.pinned === 'true';
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { content: { contains: filters.search } },
      ];
    }

    const rows = await this.prisma.notes.findMany({
      where,
      include: { folder: { select: { id: true, name: true } } },
      orderBy: [{ pinned: 'desc' }, { updated_at: 'desc' }],
    });

    return rows.map(mapNote);
  }

  async findOne(userId: string, id: string): Promise<NoteWithFolderResponse> {
    const row = await this.prisma.notes.findUnique({
      where: { id },
      include: { folder: { select: { id: true, name: true } } },
    });

    if (!row) {
      throw new NotFoundException('Note not found');
    }
    if (row.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this note');
    }

    return mapNote(row);
  }

  async create(
    userId: string,
    dto: CreateNoteDto,
  ): Promise<NoteWithFolderResponse> {
    const row = await this.prisma.notes.create({
      data: {
        user_id: userId,
        title: dto.title,
        content: dto.content ?? null,
        folder_id: dto.folderId ?? null,
        project_id: dto.projectId ?? null,
        pinned: dto.pinned ?? false,
      },
      include: { folder: { select: { id: true, name: true } } },
    });

    this.undoService
      .recordChange(userId, 'notes', row.id, 'create', null, this.toRawData(row))
      .catch(() => {});

    return mapNote(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateNoteDto,
  ): Promise<NoteWithFolderResponse> {
    const existing = await this.prisma.notes.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Note not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to update this note');
    }

    const data: Prisma.notesUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.pinned !== undefined) data.pinned = dto.pinned;
    if (dto.folderId !== undefined) {
      data.folder = dto.folderId
        ? { connect: { id: dto.folderId } }
        : { disconnect: true };
    }
    if (dto.projectId !== undefined) {
      data.project = dto.projectId
        ? { connect: { id: dto.projectId } }
        : { disconnect: true };
    }

    const row = await this.prisma.notes.update({
      where: { id },
      data,
      include: { folder: { select: { id: true, name: true } } },
    });

    this.undoService
      .recordChange(userId, 'notes', id, 'update', this.toRawData(existing), this.toRawData(row))
      .catch(() => {});

    return mapNote(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.notes.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Note not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this note');
    }

    await this.prisma.notes.delete({ where: { id } });

    this.undoService
      .recordChange(userId, 'notes', id, 'delete', this.toRawData(existing), null)
      .catch(() => {});
  }

  private toRawData(row: any): Record<string, unknown> {
    const { folder, ...data } = row;
    return data;
  }
}
