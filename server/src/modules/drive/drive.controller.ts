import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DriveConnectedGuard } from '../google/guards/drive-connected.guard';
import { GoogleAccessToken } from '../google/decorators/google-access-token.decorator';
import { DriveService } from './drive.service';
import { DriveListFiltersDto } from './dto/drive-list-filters.dto';

@Controller('projects/:projectId/drive')
@UseGuards(DriveConnectedGuard)
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Get('files')
  listFiles(
    @GoogleAccessToken() accessToken: string,
    @Query() filters: DriveListFiltersDto,
  ) {
    return this.driveService.listFiles(accessToken, {
      pageToken: filters.pageToken,
      maxResults: filters.maxResults,
      mimeType: filters.mimeType,
    });
  }

  @Post('files')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @GoogleAccessToken() accessToken: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.driveService.uploadFile(accessToken, file.buffer, {
      name: file.originalname,
      mimeType: file.mimetype,
    });
  }

  @Get('files/:id')
  getFileUrl(
    @GoogleAccessToken() accessToken: string,
    @Param('id') fileId: string,
  ) {
    return this.driveService.getFileUrl(accessToken, fileId);
  }

  @Delete('files/:id')
  deleteFile(
    @GoogleAccessToken() accessToken: string,
    @Param('id') fileId: string,
  ) {
    return this.driveService.deleteFile(accessToken, fileId);
  }
}
