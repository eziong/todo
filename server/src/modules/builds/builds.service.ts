import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBuildDto } from './dto/create-build.dto';

export interface BuildResponse {
  id: string;
  projectId: string;
  buildCommandId: string | null;
  buildNumber: number;
  status: string;
  command: string | null;
  log: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  notes: string | null;
  createdAt: string;
  projectName: string;
  projectColor: string | null;
}

// Row shape from Prisma query with project join
interface BuildRowWithJoins {
  id: string;
  project_id: string;
  build_command_id: string | null;
  build_number: number;
  status: string;
  command: string | null;
  log: string | null;
  started_at: Date | null;
  finished_at: Date | null;
  notes: string | null;
  created_at: Date;
  project: {
    id: string;
    name: string;
    color: string | null;
    user_id: string;
  };
}

function mapBuild(row: BuildRowWithJoins): BuildResponse {
  return {
    id: row.id,
    projectId: row.project_id,
    buildCommandId: row.build_command_id,
    buildNumber: row.build_number,
    status: row.status,
    command: row.command,
    log: row.log,
    startedAt: row.started_at?.toISOString() ?? null,
    finishedAt: row.finished_at?.toISOString() ?? null,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    projectName: row.project.name,
    projectColor: row.project.color,
  };
}

const buildInclude = {
  project: {
    select: { id: true, name: true, color: true, user_id: true },
  },
} as const;

@Injectable()
export class BuildsService {
  private readonly logger = new Logger(BuildsService.name);

  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(
    userId: string,
    projectId?: string,
  ): Promise<BuildResponse[]> {
    const rows = await this.prisma.builds.findMany({
      where: {
        project: { user_id: userId },
        ...(projectId ? { project_id: projectId } : {}),
      },
      include: buildInclude,
      orderBy: { created_at: 'desc' },
    });

    return rows.map(mapBuild);
  }

  async findOne(
    userId: string,
    id: string,
  ): Promise<BuildResponse> {
    const row = await this.prisma.builds.findUnique({
      where: { id },
      include: buildInclude,
    });

    if (!row) {
      throw new NotFoundException('Build not found');
    }
    if (row.project.user_id !== userId) {
      throw new ForbiddenException('Not allowed to access this build');
    }

    return mapBuild(row);
  }

  async create(
    userId: string,
    dto: CreateBuildDto,
  ): Promise<BuildResponse> {
    // If buildCommandId provided, look up the webhook config
    let webhookConfig: {
      id: string;
      label: string;
      url: string;
      method: string;
      headers: Record<string, string>;
      body_template: string | null;
    } | null = null;

    if (dto.buildCommandId) {
      const bc = await this.prisma.build_commands.findUnique({
        where: { id: dto.buildCommandId },
        include: { project: { select: { user_id: true } } },
      });

      if (!bc) {
        throw new NotFoundException('Build command not found');
      }
      if (bc.project.user_id !== userId) {
        throw new ForbiddenException('Not allowed to use this build command');
      }

      webhookConfig = {
        id: bc.id,
        label: bc.label,
        url: bc.url,
        method: bc.method,
        headers: bc.headers as Record<string, string>,
        body_template: bc.body_template,
      };
    }

    const build = await this.prisma.$transaction(async (tx) => {
      // 1. Verify project ownership
      const project = await tx.projects.findUnique({
        where: { id: dto.projectId },
        select: { id: true, user_id: true },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
      if (project.user_id !== userId) {
        throw new ForbiddenException('Not allowed to create builds in this project');
      }

      // 2. Get next build_number
      const lastBuild = await tx.builds.findFirst({
        where: { project_id: dto.projectId },
        orderBy: { build_number: 'desc' },
        select: { build_number: true },
      });
      const nextBuildNumber = (lastBuild?.build_number ?? 0) + 1;

      // 3. Create build
      const commandLabel = webhookConfig
        ? `Webhook: ${webhookConfig.label}`
        : dto.command ?? null;

      const created = await tx.builds.create({
        data: {
          project_id: dto.projectId,
          build_command_id: webhookConfig?.id ?? null,
          build_number: nextBuildNumber,
          status: 'pending',
          command: commandLabel,
          notes: dto.notes ?? null,
          started_at: new Date(),
        },
      });

      // 4. Fetch the complete build with joins
      const result = await tx.builds.findUnique({
        where: { id: created.id },
        include: buildInclude,
      });

      return result!;
    });

    // Activity logging (fire-and-forget)
    const buildUserId = build.project.user_id;
    this.activityService
      .create({
        userId: buildUserId,
        action: 'built',
        entityType: 'build',
        entityId: build.id,
        metadata: { buildNumber: build.build_number, projectName: build.project.name },
      })
      .catch(() => {});

    // Fire webhook after transaction (non-blocking for response, but await for status)
    if (webhookConfig) {
      await this.fireWebhook(build.id, webhookConfig, buildUserId, build.build_number);
    }

    // Re-fetch to get updated status after webhook
    const updated = await this.prisma.builds.findUnique({
      where: { id: build.id },
      include: buildInclude,
    });

    return mapBuild(updated!);
  }

  private async fireWebhook(
    buildId: string,
    config: {
      url: string;
      method: string;
      headers: Record<string, string>;
      body_template: string | null;
    },
    userId: string,
    buildNumber: number,
  ): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const fetchOptions: RequestInit = {
        method: config.method,
        headers: config.headers,
        signal: controller.signal,
      };

      // Add body for methods that support it
      if (
        config.body_template &&
        config.method !== 'GET' &&
        config.method !== 'DELETE'
      ) {
        fetchOptions.body = config.body_template;
        // Set Content-Type if not already set
        const hasContentType = Object.keys(config.headers).some(
          (k) => k.toLowerCase() === 'content-type',
        );
        if (!hasContentType) {
          fetchOptions.headers = {
            ...config.headers,
            'Content-Type': 'application/json',
          };
        }
      }

      const response = await fetch(config.url, fetchOptions);
      clearTimeout(timeout);

      if (response.ok) {
        await this.prisma.builds.update({
          where: { id: buildId },
          data: { status: 'running' },
        });
        this.notificationsService
          .create({
            userId,
            source: 'build',
            type: 'build_started',
            title: `Build #${buildNumber} started`,
            entityId: buildId,
          })
          .catch(() => {});
      } else {
        const body = await response.text().catch(() => 'No response body');
        await this.prisma.builds.update({
          where: { id: buildId },
          data: {
            status: 'failed',
            log: `Webhook failed: ${response.status} ${response.statusText}\n${body}`,
            finished_at: new Date(),
          },
        });
        this.notificationsService
          .create({
            userId,
            source: 'build',
            type: 'build_failed',
            title: `Build #${buildNumber} failed`,
            body: `Webhook returned ${response.status}`,
            entityId: buildId,
          })
          .catch(() => {});
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook failed for build ${buildId}: ${message}`);

      await this.prisma.builds.update({
        where: { id: buildId },
        data: {
          status: 'failed',
          log: `Webhook error: ${message}`,
          finished_at: new Date(),
        },
      });
      this.notificationsService
        .create({
          userId,
          source: 'build',
          type: 'build_failed',
          title: `Build #${buildNumber} failed`,
          body: message,
          entityId: buildId,
        })
        .catch(() => {});
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.builds.findUnique({
      where: { id },
      include: {
        project: { select: { user_id: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Build not found');
    }
    if (existing.project.user_id !== userId) {
      throw new ForbiddenException('Not allowed to delete this build');
    }

    await this.prisma.builds.delete({ where: { id } });
  }
}
