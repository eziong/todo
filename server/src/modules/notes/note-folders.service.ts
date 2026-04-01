import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, note_folders } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNoteFolderDto } from './dto/create-note-folder.dto';
import { UpdateNoteFolderDto } from './dto/update-note-folder.dto';

export interface NoteFolderResponse {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  position: number | null;
  createdAt: string;
}

function mapNoteFolder(row: note_folders): NoteFolderResponse {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    parentId: row.parent_id,
    position: row.position,
    createdAt: row.created_at.toISOString(),
  };
}

@Injectable()
export class NoteFoldersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<NoteFolderResponse[]> {
    const rows = await this.prisma.note_folders.findMany({
      where: { user_id: userId },
      orderBy: [
        { position: 'asc' },
        { name: 'asc' },
      ],
    });

    return rows.map(mapNoteFolder);
  }

  async create(
    userId: string,
    dto: CreateNoteFolderDto,
  ): Promise<NoteFolderResponse> {
    const row = await this.prisma.note_folders.create({
      data: {
        user_id: userId,
        name: dto.name,
        parent_id: dto.parentId ?? null,
        position: dto.position ?? null,
      },
    });

    return mapNoteFolder(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateNoteFolderDto,
  ): Promise<NoteFolderResponse> {
    const existing = await this.prisma.note_folders.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Note folder not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to update this folder');
    }

    const data: Prisma.note_foldersUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.parentId !== undefined) {
      data.parent = dto.parentId
        ? { connect: { id: dto.parentId } }
        : { disconnect: true };
    }

    const row = await this.prisma.note_folders.update({
      where: { id },
      data,
    });

    return mapNoteFolder(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.note_folders.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Note folder not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this folder');
    }

    await this.prisma.note_folders.delete({ where: { id } });
  }
}
