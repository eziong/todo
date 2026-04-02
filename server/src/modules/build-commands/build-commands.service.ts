import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { build_commands } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBuildCommandDto } from './dto/create-build-command.dto';
import { UpdateBuildCommandDto } from './dto/update-build-command.dto';

export interface BuildCommandResponse {
  id: string;
  projectId: string;
  label: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  bodyTemplate: string | null;
  position: string | null;
}

function mapBuildCommand(row: build_commands): BuildCommandResponse {
  return {
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    url: row.url,
    method: row.method,
    headers: row.headers as Record<string, string>,
    bodyTemplate: row.body_template,
    position: row.position,
  };
}

@Injectable()
export class BuildCommandsService {
  constructor(private prisma: PrismaService) {}

  private async verifyProjectOwnership(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this project');
    }
  }

  async findByProject(
    userId: string,
    projectId: string,
  ): Promise<BuildCommandResponse[]> {
    await this.verifyProjectOwnership(projectId, userId);

    const rows = await this.prisma.build_commands.findMany({
      where: { project_id: projectId },
      orderBy: { position: 'asc' },
    });

    return rows.map(mapBuildCommand);
  }

  async create(
    userId: string,
    projectId: string,
    dto: CreateBuildCommandDto,
  ): Promise<BuildCommandResponse> {
    await this.verifyProjectOwnership(projectId, userId);

    const row = await this.prisma.build_commands.create({
      data: {
        project_id: projectId,
        label: dto.label,
        url: dto.url,
        method: dto.method ?? 'POST',
        headers: dto.headers ?? {},
        body_template: dto.bodyTemplate ?? null,
        position: dto.position ?? null,
      },
    });

    return mapBuildCommand(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBuildCommandDto,
  ): Promise<BuildCommandResponse> {
    const existing = await this.prisma.build_commands.findUnique({
      where: { id },
      include: { project: { select: { user_id: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Build command not found');
    }
    if (existing.project.user_id !== userId) {
      throw new ForbiddenException('Not allowed to update this build command');
    }

    const data: Record<string, unknown> = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.method !== undefined) data.method = dto.method;
    if (dto.headers !== undefined) data.headers = dto.headers;
    if (dto.bodyTemplate !== undefined) data.body_template = dto.bodyTemplate;
    if (dto.position !== undefined) data.position = dto.position;

    const row = await this.prisma.build_commands.update({
      where: { id },
      data,
    });

    return mapBuildCommand(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.build_commands.findUnique({
      where: { id },
      include: { project: { select: { user_id: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Build command not found');
    }
    if (existing.project.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this build command');
    }

    await this.prisma.build_commands.delete({ where: { id } });
  }
}
