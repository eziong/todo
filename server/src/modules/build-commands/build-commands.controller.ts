import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { CreateBuildCommandDto } from './dto/create-build-command.dto';
import { UpdateBuildCommandDto } from './dto/update-build-command.dto';
import { BuildCommandsService } from './build-commands.service';

@Controller()
export class BuildCommandsController {
  constructor(
    private readonly buildCommandsService: BuildCommandsService,
  ) {}

  @Get('projects/:projectId/build-commands')
  findByProject(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    return this.buildCommandsService.findByProject(user.id, projectId);
  }

  @Post('projects/:projectId/build-commands')
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateBuildCommandDto,
  ) {
    return this.buildCommandsService.create(user.id, projectId, dto);
  }

  @Patch('build-commands/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBuildCommandDto,
  ) {
    return this.buildCommandsService.update(user.id, id, dto);
  }

  @Delete('build-commands/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.buildCommandsService.remove(user.id, id);
  }
}
