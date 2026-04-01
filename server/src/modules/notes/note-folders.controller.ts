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
import { CreateNoteFolderDto } from './dto/create-note-folder.dto';
import { UpdateNoteFolderDto } from './dto/update-note-folder.dto';
import { NoteFoldersService } from './note-folders.service';

@Controller('note-folders')
export class NoteFoldersController {
  constructor(private readonly noteFoldersService: NoteFoldersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.noteFoldersService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNoteFolderDto) {
    return this.noteFoldersService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateNoteFolderDto,
  ) {
    return this.noteFoldersService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.noteFoldersService.remove(user.id, id);
  }
}
