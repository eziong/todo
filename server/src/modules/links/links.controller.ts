import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { LinksService } from './links.service';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('category') category?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.linksService.findAll(user.id, category, projectId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLinkDto) {
    return this.linksService.create(user.id, dto);
  }

  @Patch(':id/click')
  incrementClick(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.linksService.incrementClick(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateLinkDto,
  ) {
    return this.linksService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.linksService.remove(user.id, id);
  }
}
