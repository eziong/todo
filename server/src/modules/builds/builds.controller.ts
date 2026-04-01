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
import { CreateBuildDto } from './dto/create-build.dto';
import { BuildsService } from './builds.service';

@Controller('builds')
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('projectId') projectId?: string,
  ) {
    return this.buildsService.findAll(user.id, projectId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.buildsService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBuildDto) {
    return this.buildsService.create(user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.buildsService.remove(user.id, id);
  }
}
