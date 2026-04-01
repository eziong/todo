import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { NotificationFiltersDto } from './dto/notification-filters.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: NotificationFiltersDto,
  ) {
    return this.notificationsService.findAll(user.id, filters.source);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.remove(user.id, id);
  }
}
