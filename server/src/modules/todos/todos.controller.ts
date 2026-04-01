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
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoFiltersDto } from './dto/todo-filters.dto';
import { TodosService } from './todos.service';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() filters: TodoFiltersDto) {
    return this.todosService.findAll(user.id, filters);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.todosService.findOne(user.id, id);
  }

  @Get(':id/subtasks')
  findSubtasks(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.todosService.findSubtasks(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTodoDto) {
    return this.todosService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ) {
    return this.todosService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.todosService.remove(user.id, id);
  }
}
