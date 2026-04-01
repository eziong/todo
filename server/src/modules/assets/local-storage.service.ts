import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LocalStorageService {
  private readonly basePath: string;
  private readonly logger = new Logger(LocalStorageService.name);

  constructor() {
    this.basePath = path.join(process.cwd(), 'data', 'assets');
    fs.mkdirSync(this.basePath, { recursive: true });
    this.logger.log(`Local storage initialized at ${this.basePath}`);
  }

  async upload(
    userId: string,
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<{ path: string; publicUrl: string }> {
    const ext = filename.split('.').pop() ?? 'bin';
    const randomSuffix = Math.random().toString(36).slice(2);
    const storagePath = `${userId}/${Date.now()}-${randomSuffix}.${ext}`;
    const fullPath = path.join(this.basePath, storagePath);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    return {
      path: storagePath,
      publicUrl: `/api/assets/files/${storagePath}`,
    };
  }

  async remove(storagePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, storagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getPublicUrl(storagePath: string): string {
    return `/api/assets/files/${storagePath}`;
  }
}
