import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as jwt from 'jsonwebtoken';
import { GoogleTokenService } from './google-token.service';
import { PrismaService } from '../../prisma/prisma.service';

export type GoogleService = 'youtube' | 'drive';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

const SERVICE_SCOPES: Record<GoogleService, string[]> = {
  youtube: YOUTUBE_SCOPES,
  drive: DRIVE_SCOPES,
};

interface OAuthStatePayload {
  sub: string;
  purpose: 'google_oauth';
  service: GoogleService;
  projectId: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private config: ConfigService,
    private googleTokenService: GoogleTokenService,
    private prisma: PrismaService,
  ) {}

  private getOAuth2Client() {
    return new google.auth.OAuth2(
      this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      this.config.getOrThrow<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  private getJwtSecret(): string {
    return this.config.getOrThrow<string>('SUPABASE_JWT_SECRET');
  }

  getAuthUrl(
    userId: string,
    service: GoogleService,
    projectId: string,
  ): string {
    const state = jwt.sign(
      {
        sub: userId,
        purpose: 'google_oauth',
        service,
        projectId,
      } as OAuthStatePayload,
      this.getJwtSecret(),
      { expiresIn: '10m' },
    );

    const oauth2Client = this.getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SERVICE_SCOPES[service],
      prompt: 'select_account consent',
      state,
    });
  }

  async handleCallback(code: string, state: string): Promise<string> {
    // Verify state JWT
    let payload: OAuthStatePayload;
    try {
      payload = jwt.verify(state, this.getJwtSecret()) as OAuthStatePayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    if (
      payload.purpose !== 'google_oauth' ||
      !payload.sub ||
      !payload.service ||
      !payload.projectId
    ) {
      throw new UnauthorizedException('Invalid OAuth state payload');
    }

    const userId = payload.sub;
    const service = payload.service;
    const projectId = payload.projectId;

    // Exchange code for tokens
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens for this specific service + project
    await this.googleTokenService.saveTokens(
      userId,
      projectId,
      service,
      tokens,
    );

    const webAppUrl = this.config.getOrThrow<string>('WEB_APP_URL');

    // Cache YouTube channel info (best-effort) — only for YouTube service
    if (service === 'youtube') {
      try {
        const channelCount = await this.cacheChannel(
          userId,
          projectId,
          tokens.access_token ?? '',
        );
        // If 0 or 2+ channels, redirect with selectChannel flag
        if (channelCount !== 1) {
          return `${webAppUrl}/projects/${projectId}/youtube?connected=youtube&selectChannel=true`;
        }
      } catch (err) {
        this.logger.warn(
          `YouTube channel caching failed for user ${userId}: ${err}`,
        );
        return `${webAppUrl}/projects/${projectId}/youtube?connected=youtube&selectChannel=true`;
      }
    }

    // For Drive or YouTube with single channel: redirect to project page
    if (service === 'youtube') {
      return `${webAppUrl}/projects/${projectId}/youtube?connected=youtube`;
    }
    return `${webAppUrl}/projects/${projectId}/settings?connected=${service}`;
  }

  /**
   * Cache YouTube channel info. Returns the number of channels found.
   * If exactly 1 channel, auto-selects it. Otherwise returns the count.
   */
  async cacheChannel(
    userId: string,
    projectId: string,
    accessToken: string,
  ): Promise<number> {
    if (!accessToken) return 0;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const yt = google.youtube({ version: 'v3', auth: oauth2Client });

    const res = await yt.channels.list({
      part: ['snippet', 'statistics'],
      mine: true,
      maxResults: 50,
    });

    const items = res.data.items ?? [];
    if (items.length === 1) {
      const channel = items[0];
      await this.prisma.youtube_channels.upsert({
        where: { project_id: projectId },
        create: {
          user_id: userId,
          project_id: projectId,
          channel_id: channel.id ?? '',
          channel_title: channel.snippet?.title ?? null,
          subscriber_count: Number(channel.statistics?.subscriberCount ?? 0),
          video_count: Number(channel.statistics?.videoCount ?? 0),
          view_count: BigInt(channel.statistics?.viewCount ?? 0),
          thumbnail_url:
            channel.snippet?.thumbnails?.default?.url ?? null,
          synced_at: new Date(),
        },
        update: {
          channel_id: channel.id ?? '',
          channel_title: channel.snippet?.title ?? null,
          subscriber_count: Number(channel.statistics?.subscriberCount ?? 0),
          video_count: Number(channel.statistics?.videoCount ?? 0),
          view_count: BigInt(channel.statistics?.viewCount ?? 0),
          thumbnail_url:
            channel.snippet?.thumbnails?.default?.url ?? null,
          synced_at: new Date(),
        },
      });
    }

    return items.length;
  }
}
