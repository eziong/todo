import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('info')
  async getInfo(@CurrentUser() user: AuthUser) {
    return this.backupService.getInfo();
  }

  @Post('export')
  async exportBackup(
    @CurrentUser() user: AuthUser,
    @Body() body: { includeAssets?: boolean },
    @Res() res: Response,
  ) {
    const includeAssets = body?.includeAssets ?? false;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    const filename = includeAssets
      ? `backup-full-${timestamp}.zip`
      : `backup-db-${timestamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    await this.backupService.exportBackup(res, includeAssets);
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 500 * 1024 * 1024 } }),
  )
  async importBackup(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.backupService.importBackup(file.buffer);
  }
}
