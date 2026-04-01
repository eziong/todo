import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalStorageService } from './local-storage.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

export interface AssetResponse {
  id: string;
  userId: string;
  contentId: string | null;
  projectId: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageType: string;
  storagePath: string | null;
  thumbnailUrl: string | null;
  tags: string[];
  createdAt: string;
}

function mapAsset(
  row: Prisma.assetsGetPayload<object>,
): AssetResponse {
  return {
    id: row.id,
    userId: row.user_id,
    contentId: row.content_id,
    projectId: row.project_id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    storageType: row.storage_type,
    storagePath: row.storage_path,
    thumbnailUrl: row.thumbnail_url,
    tags: row.tags ?? [],
    createdAt: row.created_at.toISOString(),
  };
}

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private storage: LocalStorageService,
  ) {}

  async findAll(
    userId: string,
    contentId?: string,
    projectId?: string,
    storageType?: string,
    mimeType?: string,
    search?: string,
  ): Promise<AssetResponse[]> {
    const where: Prisma.assetsWhereInput = {
      user_id: userId,
    };

    if (contentId) {
      where.content_id = contentId;
    }
    if (projectId) {
      where.project_id = projectId;
    }
    if (storageType) {
      where.storage_type = storageType;
    }
    if (mimeType) {
      where.mime_type = { startsWith: mimeType };
    }
    if (search) {
      where.filename = { contains: search };
    }

    const rows = await this.prisma.assets.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return rows.map(mapAsset);
  }

  async findOne(userId: string, id: string): Promise<AssetResponse> {
    const row = await this.prisma.assets.findUnique({ where: { id } });

    if (!row) {
      throw new NotFoundException('Asset not found');
    }
    if (row.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this asset');
    }

    return mapAsset(row);
  }

  async upload(
    userId: string,
    file: Express.Multer.File,
    contentId?: string,
    projectId?: string,
    tags?: string[],
  ): Promise<AssetResponse> {
    const { path, publicUrl } = await this.storage.upload(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const row = await this.prisma.assets.create({
      data: {
        user_id: userId,
        filename: file.originalname,
        mime_type: file.mimetype,
        size_bytes: file.size,
        storage_type: 'local',
        storage_path: path,
        thumbnail_url: publicUrl,
        content_id: contentId ?? null,
        project_id: projectId ?? null,
        tags: tags ?? [],
      },
    });

    return mapAsset(row);
  }

  async create(
    userId: string,
    dto: CreateAssetDto,
  ): Promise<AssetResponse> {
    const row = await this.prisma.assets.create({
      data: {
        user_id: userId,
        filename: dto.filename,
        mime_type: dto.mimeType,
        size_bytes: dto.sizeBytes,
        storage_type: dto.storageType,
        storage_path: dto.storagePath,
        thumbnail_url: dto.thumbnailUrl ?? null,
        content_id: dto.contentId ?? null,
        project_id: dto.projectId ?? null,
        tags: dto.tags ?? [],
      },
    });

    return mapAsset(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAssetDto,
  ): Promise<AssetResponse> {
    const existing = await this.prisma.assets.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Asset not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to update this asset');
    }

    const data: Prisma.assetsUpdateInput = {};
    if (dto.filename !== undefined) data.filename = dto.filename;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.contentId !== undefined) {
      data.content = dto.contentId
        ? { connect: { id: dto.contentId } }
        : { disconnect: true };
    }
    if (dto.projectId !== undefined) {
      data.project = dto.projectId
        ? { connect: { id: dto.projectId } }
        : { disconnect: true };
    }

    const row = await this.prisma.assets.update({
      where: { id },
      data,
    });

    return mapAsset(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.assets.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Asset not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this asset');
    }

    // Delete from local storage if applicable
    if (existing.storage_type === 'local' && existing.storage_path) {
      await this.storage.remove(existing.storage_path);
    }

    await this.prisma.assets.delete({ where: { id } });
  }
}
