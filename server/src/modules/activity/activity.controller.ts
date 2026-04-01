import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { ActivityService } from './activity.service';
import { ActivityFiltersDto } from './dto/activity-filters.dto';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findRecent(
    @CurrentUser() user: AuthUser,
    @Query() filters: ActivityFiltersDto,
  ) {
    return this.activityService.findRecent(user.id, filters.limit ?? 10);
  }
}
