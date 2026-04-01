import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GoogleTokenService, TokenService } from '../google-token.service';

@Injectable()
export class GoogleConnectedGuard implements CanActivate {
  protected readonly requiredService: TokenService | null = null;

  constructor(protected readonly googleTokenService: GoogleTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const service = this.requiredService;
    if (!service) {
      throw new ForbiddenException('Guard misconfigured: no service specified');
    }

    const projectId = request.params?.projectId;
    if (!projectId) {
      throw new ForbiddenException('Project ID required');
    }

    const hasService = await this.googleTokenService.hasService(
      userId,
      projectId,
      service,
    );
    if (!hasService) {
      throw new ForbiddenException(`Google ${service} not connected`);
    }

    const accessToken =
      await this.googleTokenService.getValidAccessToken(
        userId,
        projectId,
        service,
      );

    if (!accessToken) {
      throw new ForbiddenException(
        `Google ${service} token expired or invalid`,
      );
    }

    request.googleAccessToken = accessToken;
    return true;
  }
}
