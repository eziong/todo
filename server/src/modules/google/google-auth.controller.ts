import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { GoogleAuthService, GoogleService } from './google-auth.service';
import { GoogleTokenService } from './google-token.service';

@Controller('google')
export class GoogleAuthController {
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly googleTokenService: GoogleTokenService,
  ) {}

  @Get('auth-url')
  getAuthUrl(
    @CurrentUser() user: AuthUser,
    @Query('service') service?: string,
    @Query('projectId') projectId?: string,
  ) {
    if (!service || !['youtube', 'drive'].includes(service)) {
      throw new BadRequestException(
        'service query param required (youtube or drive)',
      );
    }
    if (!projectId) {
      throw new BadRequestException('projectId query param required');
    }
    const url = this.googleAuthService.getAuthUrl(
      user.id,
      service as GoogleService,
      projectId,
    );
    return { url };
  }

  @Public()
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state parameter');
    }

    try {
      const redirectUrl = await this.googleAuthService.handleCallback(
        code,
        state,
      );
      res.redirect(redirectUrl);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new BadRequestException('OAuth callback failed');
    }
  }

  @Post('disconnect')
  async disconnect(
    @CurrentUser() user: AuthUser,
    @Body() body?: { service?: string; projectId?: string },
  ) {
    const service = body?.service;
    const projectId = body?.projectId;

    if (service && projectId && ['youtube', 'drive'].includes(service)) {
      await this.googleTokenService.disconnectService(
        user.id,
        projectId,
        service as 'youtube' | 'drive',
      );
    } else if (!projectId) {
      // Legacy: revoke all (account deletion)
      await this.googleTokenService.revokeAccess(user.id);
    } else {
      throw new BadRequestException(
        'service (youtube or drive) and projectId required',
      );
    }
    return { disconnected: true };
  }

  @Get('status')
  async getStatus(
    @CurrentUser() user: AuthUser,
    @Query('projectId') projectId?: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId query param required');
    }
    return this.googleTokenService.checkConnection(user.id, projectId);
  }
}
