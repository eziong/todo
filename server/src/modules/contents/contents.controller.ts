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
import { ReorderContentDto } from './dto/reorder-content.dto';
import { CreateContentChecklistDto } from './dto/create-content-checklist.dto';
import { UpdateContentChecklistDto } from './dto/update-content-checklist.dto';
import { UpsertStageDataDto } from './dto/upsert-stage-data.dto';
import { ContentsService } from './contents.service';

@Controller()
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get('contents')
  findAll(@CurrentUser() user: AuthUser, @Query() filters: ContentFiltersDto) {
    return this.contentsService.findAll(user.id, filters);
  }

  @Patch('contents/reorder')
  reorder(@CurrentUser() user: AuthUser, @Body() dto: ReorderContentDto) {
    return this.contentsService.reorder(user.id, dto);
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

  // --- Checklists ---

  @Get('contents/:contentId/checklists')
  findChecklists(
    @CurrentUser() user: AuthUser,
    @Param('contentId') contentId: string,
  ) {
    return this.contentsService.findChecklists(user.id, contentId);
  }

  @Post('contents/:contentId/checklists')
  createChecklist(
    @CurrentUser() user: AuthUser,
    @Param('contentId') contentId: string,
    @Body() dto: CreateContentChecklistDto,
  ) {
    return this.contentsService.createChecklist(user.id, contentId, dto);
  }

  @Patch('content-checklists/:id')
  updateChecklist(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateContentChecklistDto,
  ) {
    return this.contentsService.updateChecklist(user.id, id, dto);
  }

  @Delete('content-checklists/:id')
  removeChecklist(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.contentsService.removeChecklist(user.id, id);
  }
}
