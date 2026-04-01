import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private notificationsService: NotificationsService) {}

  async createNotification(input: {
    userId: string;
    source: 'youtube' | 'build';
    type: string;
    title: string;
    body: string | null;
    url: string | null;
    entityId: string | null;
  }): Promise<void> {
    await this.notificationsService.create(input);
  }
}
