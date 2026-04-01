import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';

export type TokenService = 'youtube' | 'drive';

export interface GoogleConnectionStatus {
  youtubeConnected: boolean;
  driveConnected: boolean;
  channelTitle: string | null;
  channelId: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  videoCount: number | null;
}

@Injectable()
export class GoogleTokenService {
  private readonly logger = new Logger(GoogleTokenService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private getOAuth2Client() {
    return new google.auth.OAuth2(
      this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      this.config.getOrThrow<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  async hasService(
    userId: string,
    projectId: string,
    service: TokenService,
  ): Promise<boolean> {
    const tokenRow = await this.prisma.google_tokens.findUnique({
      where: {
        user_id_project_id_service: {
          user_id: userId,
          project_id: projectId,
          service,
        },
      },
      select: { id: true },
    });
    return !!tokenRow;
  }

  async getValidAccessToken(
    userId: string,
    projectId: string,
    service: TokenService,
  ): Promise<string | null> {
    const tokenRow = await this.prisma.google_tokens.findUnique({
      where: {
        user_id_project_id_service: {
          user_id: userId,
          project_id: projectId,
          service,
        },
      },
    });

    if (!tokenRow) return null;

    const expiresAt = new Date(tokenRow.expires_at);
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

    if (expiresAt > fiveMinutesFromNow) {
      return tokenRow.access_token;
    }

    // Token expired or expiring soon — refresh
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: tokenRow.refresh_token });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      const newExpiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      await this.prisma.google_tokens.update({
        where: {
          user_id_project_id_service: {
            user_id: userId,
            project_id: projectId,
            service,
          },
        },
        data: {
          access_token: credentials.access_token ?? tokenRow.access_token,
          expires_at: newExpiresAt,
          updated_at: new Date(),
        },
      });

      return credentials.access_token ?? null;
    } catch (err) {
      this.logger.warn(
        `Token refresh failed for user ${userId} project ${projectId} service ${service}: ${err}`,
      );
      return null;
    }
  }

  async saveTokens(
    userId: string,
    projectId: string,
    service: TokenService,
    tokens: {
      access_token?: string | null;
      refresh_token?: string | null;
      expiry_date?: number | null;
      scope?: string;
    },
  ): Promise<void> {
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    const scopes = tokens.scope ? tokens.scope.split(' ') : [];

    const data = {
      access_token: tokens.access_token ?? '',
      refresh_token: tokens.refresh_token ?? '',
      token_type: 'Bearer',
      expires_at: expiresAt,
      scopes,
      updated_at: new Date(),
    };

    await this.prisma.google_tokens.upsert({
      where: {
        user_id_project_id_service: {
          user_id: userId,
          project_id: projectId,
          service,
        },
      },
      create: { user_id: userId, project_id: projectId, service, ...data },
      update: tokens.refresh_token
        ? data
        : {
            access_token: data.access_token,
            expires_at: data.expires_at,
            scopes: data.scopes,
            updated_at: data.updated_at,
          },
    });
  }

  async revokeAccess(userId: string): Promise<void> {
    const tokenRows = await this.prisma.google_tokens.findMany({
      where: { user_id: userId },
    });

    for (const row of tokenRows) {
      if (row.access_token) {
        try {
          const oauth2Client = this.getOAuth2Client();
          await oauth2Client.revokeToken(row.access_token);
        } catch {
          // Revocation failed — still delete local records
        }
      }
    }

    await this.prisma.youtube_channels.deleteMany({
      where: { user_id: userId },
    });
    await this.prisma.google_tokens.deleteMany({
      where: { user_id: userId },
    });
  }

  async disconnectService(
    userId: string,
    projectId: string,
    service: TokenService,
  ): Promise<void> {
    const tokenRow = await this.prisma.google_tokens.findUnique({
      where: {
        user_id_project_id_service: {
          user_id: userId,
          project_id: projectId,
          service,
        },
      },
    });

    if (!tokenRow) return;

    // Revoke token (best-effort)
    if (tokenRow.access_token) {
      try {
        const oauth2Client = this.getOAuth2Client();
        await oauth2Client.revokeToken(tokenRow.access_token);
      } catch {
        // Continue even if revocation fails
      }
    }

    // Delete the token row
    await this.prisma.google_tokens.delete({
      where: {
        user_id_project_id_service: {
          user_id: userId,
          project_id: projectId,
          service,
        },
      },
    });

    // Clean up service-specific data
    if (service === 'youtube') {
      await this.prisma.youtube_channels.deleteMany({
        where: { project_id: projectId },
      });
    }
  }

  async checkConnection(
    userId: string,
    projectId: string,
  ): Promise<GoogleConnectionStatus> {
    const tokenRows = await this.prisma.google_tokens.findMany({
      where: { user_id: userId, project_id: projectId },
      select: { service: true },
    });

    const youtubeConnected = tokenRows.some((r) => r.service === 'youtube');
    const driveConnected = tokenRows.some((r) => r.service === 'drive');

    let channelTitle: string | null = null;
    let channelId: string | null = null;
    let thumbnailUrl: string | null = null;
    let subscriberCount: number | null = null;
    let videoCount: number | null = null;

    if (youtubeConnected) {
      const channelRow = await this.prisma.youtube_channels.findUnique({
        where: { project_id: projectId },
      });

      if (channelRow) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        if (channelRow.synced_at < fiveMinutesAgo) {
          // Stale — refresh from YouTube API
          const freshData = await this.refreshChannelCache(
            userId,
            projectId,
            channelRow.channel_id,
          );
          if (freshData) {
            channelTitle = freshData.channelTitle;
            channelId = freshData.channelId;
            thumbnailUrl = freshData.thumbnailUrl;
            subscriberCount = freshData.subscriberCount;
            videoCount = freshData.videoCount;
          }
          // freshData null = channel deleted, leave all null
        } else {
          channelTitle = channelRow.channel_title;
          channelId = channelRow.channel_id;
          thumbnailUrl = channelRow.thumbnail_url;
          subscriberCount = channelRow.subscriber_count;
          videoCount = channelRow.video_count;
        }
      }
    }

    return {
      youtubeConnected,
      driveConnected,
      channelTitle,
      channelId,
      thumbnailUrl,
      subscriberCount,
      videoCount,
    };
  }

  private async refreshChannelCache(
    userId: string,
    projectId: string,
    cachedChannelId: string,
  ): Promise<{
    channelId: string;
    channelTitle: string | null;
    thumbnailUrl: string | null;
    subscriberCount: number;
    videoCount: number;
  } | null> {
    try {
      const accessToken = await this.getValidAccessToken(
        userId,
        projectId,
        'youtube',
      );
      if (!accessToken) return null;

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const yt = google.youtube({ version: 'v3', auth: oauth2Client });

      const res = await yt.channels.list({
        part: ['snippet', 'statistics'],
        id: [cachedChannelId],
      });

      const channel = res.data.items?.[0];
      if (!channel) {
        // Channel deleted on YouTube — remove stale DB entry
        await this.prisma.youtube_channels.delete({
          where: { project_id: projectId },
        });
        return null;
      }

      const freshData = {
        channelId: channel.id ?? cachedChannelId,
        channelTitle: channel.snippet?.title ?? null,
        thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? null,
        subscriberCount: Number(channel.statistics?.subscriberCount ?? 0),
        videoCount: Number(channel.statistics?.videoCount ?? 0),
      };

      // Update DB cache
      await this.prisma.youtube_channels.update({
        where: { project_id: projectId },
        data: {
          channel_title: freshData.channelTitle,
          thumbnail_url: freshData.thumbnailUrl,
          subscriber_count: freshData.subscriberCount,
          video_count: freshData.videoCount,
          view_count: BigInt(
            Number(channel.statistics?.viewCount ?? 0),
          ),
          synced_at: new Date(),
        },
      });

      return freshData;
    } catch (err) {
      this.logger.warn(
        `Channel cache refresh failed for project ${projectId}: ${err}`,
      );
      return null; // Fall back — caller uses cached data or null
    }
  }
}
