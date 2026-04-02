import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentFiltersDto } from './dto/content-filters.dto';
import { MoveContentDto } from './dto/reorder-content.dto';
import { UpsertStageDataDto } from './dto/upsert-stage-data.dto';
import { ContentsService } from './contents.service';

@Controller()
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get('contents')
  findAll(@CurrentUser() user: AuthUser, @Query() filters: ContentFiltersDto) {
    return this.contentsService.findAll(user.id, filters);
  }

  @Patch('contents/move')
  moveContent(@CurrentUser() user: AuthUser, @Body() dto: MoveContentDto) {
    return this.contentsService.moveContent(user.id, dto);
  }

  @Get('contents/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.contentsService.findOne(user.id, id);
  }

  @Post('contents')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateContentDto) {
    return this.contentsService.create(user.id, dto);
  }

  @Patch('contents/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.contentsService.update(user.id, id, dto);
  }

  @Delete('contents/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.contentsService.remove(user.id, id);
  }

  // --- Stage Data ---

  @Get('contents/:contentId/stage-data')
  findStageData(
    @CurrentUser() user: AuthUser,
    @Param('contentId') contentId: string,
  ) {
    return this.contentsService.findStageData(user.id, contentId);
  }

  @Put('contents/:contentId/stage-data/:stage')
  upsertStageData(
    @CurrentUser() user: AuthUser,
    @Param('contentId') contentId: string,
    @Param('stage') stage: string,
    @Body() dto: UpsertStageDataDto,
  ) {
    return this.contentsService.upsertStageData(user.id, contentId, stage, dto);
  }
}
