import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { CreateInboxItemDto } from './dto/create-inbox-item.dto';
import { ProcessInboxItemDto } from './dto/process-inbox-item.dto';
import { InboxService } from './inbox.service';

@Controller('inbox')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('processed') processed?: string,
  ) {
    return this.inboxService.findAll(user.id, processed);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInboxItemDto) {
    return this.inboxService.create(user.id, dto);
  }

  @Post(':id/process')
  process(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ProcessInboxItemDto,
  ) {
    return this.inboxService.process(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.inboxService.remove(user.id, id);
  }
}
