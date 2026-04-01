import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetFiltersDto } from './dto/asset-filters.dto';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Public()
  @Get('files/*')
  serveFile(@Param() params: Record<string, string>, @Res() res: Response) {
    const filePath = params[0];
    if (!filePath) {
      res.status(404).send('Not found');
      return;
    }

    const basePath = path.join(process.cwd(), 'data', 'assets');
    const fullPath = path.join(basePath, filePath);

    // Security: prevent directory traversal
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(basePath))) {
      res.status(403).send('Forbidden');
      return;
    }

    if (!fs.existsSync(resolvedPath)) {
      res.status(404).send('Not found');
      return;
    }

    // Detect MIME type from extension
    const ext = path.extname(resolvedPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.json': 'application/json',
      '.txt': 'text/plain',
    };

    res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = fs.createReadStream(resolvedPath);
    stream.pipe(res);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: AssetFiltersDto,
  ) {
    return this.assetsService.findAll(
      user.id,
      filters.contentId,
      filters.projectId,
      filters.storageType,
      filters.mimeType,
      filters.search,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.assetsService.findOne(user.id, id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('contentId') contentId?: string,
    @Body('projectId') projectId?: string,
    @Body('tags') tagsJson?: string,
  ) {
    const tags = tagsJson ? JSON.parse(tagsJson) : undefined;
    return this.assetsService.upload(
      user.id,
      file,
      contentId,
      projectId,
      tags,
    );
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAssetDto) {
    return this.assetsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.assetsService.remove(user.id, id);
  }
}
