import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookSecretGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly secretEnvKey: string,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-webhook-secret'];
    const expected = this.configService.get<string>(this.secretEnvKey);

    if (!expected || secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    return true;
  }
}
