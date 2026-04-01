import { Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { UndoService } from './undo.service';

@Controller('undo')
export class UndoController {
  constructor(private readonly undoService: UndoService) {}

  @Post()
  async undo(@CurrentUser() user: AuthUser) {
    const result = await this.undoService.undo(user.id);
    if (!result) {
      return { message: 'Nothing to undo' };
    }
    return result;
  }

  @Post('redo')
  async redo(@CurrentUser() user: AuthUser) {
    const result = await this.undoService.redo(user.id);
    if (!result) {
      return { message: 'Nothing to redo' };
    }
    return result;
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.undoService.getHistory(user.id, parsedLimit);
  }
}
