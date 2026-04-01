import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.tagsService.findAll(user.id);
  }

  @Get('todo/:todoId')
  findByTodoId(
    @CurrentUser() user: AuthUser,
    @Param('todoId') todoId: string,
  ) {
    return this.tagsService.findByTodoId(user.id, todoId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTagDto) {
    return this.tagsService.create(user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tagsService.remove(user.id, id);
  }
}
