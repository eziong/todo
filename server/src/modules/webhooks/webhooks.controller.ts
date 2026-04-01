import {
  Body,
  Controller,
  Headers,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';

interface GenericWebhookBody {
  user_id: string;
  type: string;
  title: string;
  body?: string | null;
  url?: string | null;
  entity_id?: string | null;
}

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Post('youtube')
  async handleYoutube(
    @Headers('x-webhook-secret') secret: string,
    @Body() body: GenericWebhookBody,
  ) {
    this.validateWebhookSecret(secret, 'YOUTUBE_WEBHOOK_SECRET');
    this.validateGenericBody(body);

    await this.webhooksService.createNotification({
      userId: body.user_id,
      source: 'youtube',
      type: body.type,
      title: body.title,
      body: body.body ?? null,
      url: body.url ?? null,
      entityId: body.entity_id ?? null,
    });

    return { success: true };
  }

  @Public()
  @Post('builds')
  async handleBuilds(
    @Headers('x-webhook-secret') secret: string,
    @Body() body: GenericWebhookBody,
  ) {
    this.validateWebhookSecret(secret, 'BUILD_WEBHOOK_SECRET');
    this.validateGenericBody(body);

    await this.webhooksService.createNotification({
      userId: body.user_id,
      source: 'build',
      type: body.type,
      title: body.title,
      body: body.body ?? null,
      url: body.url ?? null,
      entityId: body.entity_id ?? null,
    });

    return { success: true };
  }

  private validateWebhookSecret(
    headerSecret: string,
    envKey: string,
  ): void {
    const expected = process.env[envKey];
    if (!expected || headerSecret !== expected) {
      throw new BadRequestException('Invalid webhook secret');
    }
  }

  private validateGenericBody(body: GenericWebhookBody): void {
    if (!body.user_id || !body.type || !body.title) {
      throw new BadRequestException('Missing required fields: user_id, type, title');
    }
  }
}
