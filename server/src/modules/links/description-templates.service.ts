import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDescriptionTemplateDto } from './dto/create-description-template.dto';
import { UpdateDescriptionTemplateDto } from './dto/update-description-template.dto';

export interface DescriptionTemplateResponse {
  id: string;
  userId: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapDescriptionTemplate(
  row: Prisma.description_templatesGetPayload<object>,
): DescriptionTemplateResponse {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    content: row.content,
    isDefault: row.is_default,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

@Injectable()
export class DescriptionTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<DescriptionTemplateResponse[]> {
    const rows = await this.prisma.description_templates.findMany({
      where: { user_id: userId },
      orderBy: [{ is_default: 'desc' }, { updated_at: 'desc' }],
    });

    return rows.map(mapDescriptionTemplate);
  }

  async create(
    userId: string,
    dto: CreateDescriptionTemplateDto,
  ): Promise<DescriptionTemplateResponse> {
    const row = await this.prisma.description_templates.create({
      data: {
        user_id: userId,
        name: dto.name,
        content: dto.content,
        is_default: dto.isDefault ?? false,
      },
    });

    return mapDescriptionTemplate(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateDescriptionTemplateDto,
  ): Promise<DescriptionTemplateResponse> {
    const existing = await this.prisma.description_templates.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Description template not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException(
        'Not allowed to update this description template',
      );
    }

    const data: Prisma.description_templatesUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.isDefault !== undefined) data.is_default = dto.isDefault;

    const row = await this.prisma.description_templates.update({
      where: { id },
      data,
    });

    return mapDescriptionTemplate(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.description_templates.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Description template not found');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException(
        'Not allowed to delete this description template',
      );
    }

    await this.prisma.description_templates.delete({ where: { id } });
  }
}
