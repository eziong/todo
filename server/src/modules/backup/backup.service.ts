import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import archiver = require('archiver');
import AdmZip = require('adm-zip');
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Writable } from 'stream';

// Tables to export/import in FK dependency order
const EXPORT_TABLES = [
  'tags',
  'projects',
  'todos',
  'todo_tags',
  'inbox_items',
  'recurring_rules',
  'build_commands',
  'builds',
  'note_folders',
  'notes',
  'description_templates',
  'contents',
  'youtube_channels',
  'links',
  'assets',
  'sponsorships',
  'notifications',
  'sns_accounts',
  'sns_reminders',
  'activity_log',
] as const;

type TableName = (typeof EXPORT_TABLES)[number];

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly assetsDir = path.join(process.cwd(), 'data', 'assets');

  constructor(private readonly prisma: PrismaService) {}

  async getInfo(): Promise<{
    dbSizeBytes: number;
    assetCount: number;
    totalAssetBytes: number;
  }> {
    // Estimate DB size by counting rows across all tables
    let dbSizeBytes = 0;
    for (const table of EXPORT_TABLES) {
      const count = await (this.prisma[table] as any).count();
      // Rough estimate: ~200 bytes per row
      dbSizeBytes += count * 200;
    }

    let assetCount = 0;
    let totalAssetBytes = 0;
    try {
      this.countAssetsRecursive(this.assetsDir, (size) => {
        assetCount++;
        totalAssetBytes += size;
      });
    } catch {
      // Assets directory may not exist
    }

    return { dbSizeBytes, assetCount, totalAssetBytes };
  }

  async exportBackup(
    output: Writable,
    includeAssets: boolean,
  ): Promise<void> {
    // 1. Export all tables as JSON (excluding google_tokens and change_history)
    const data: Record<string, unknown[]> = {};

    for (const table of EXPORT_TABLES) {
      data[table] = await (this.prisma[table] as any).findMany();
    }

    const jsonStr = JSON.stringify(data, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    );

    // 2. Create checksum
    const checksum = crypto
      .createHash('sha256')
      .update(jsonStr)
      .digest('hex');

    const manifest = {
      version: 2,
      format: 'json',
      exportedAt: new Date().toISOString(),
      includeAssets,
      dataChecksum: checksum,
      tableCounts: Object.fromEntries(
        EXPORT_TABLES.map((t) => [t, data[t].length]),
      ),
    };

    // 3. Build ZIP archive
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(output);

    archive.append(JSON.stringify(manifest, null, 2), {
      name: 'manifest.json',
    });
    archive.append(jsonStr, { name: 'data.json' });

    if (includeAssets && fs.existsSync(this.assetsDir)) {
      archive.directory(this.assetsDir, 'assets');
    }

    await archive.finalize();
  }

  async importBackup(
    buffer: Buffer,
  ): Promise<{
    success: boolean;
    stats: Record<string, number>;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // 1. Parse ZIP
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new BadRequestException('Invalid ZIP file');
    }

    // 2. Read and validate manifest
    const manifestEntry = zip.getEntry('manifest.json');
    if (!manifestEntry) {
      throw new BadRequestException('Invalid backup: missing manifest.json');
    }

    let manifest: {
      version: number;
      format?: string;
      dataChecksum?: string;
      dbChecksum?: string;
      includeAssets?: boolean;
    };
    try {
      manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid manifest.json');
    }

    if (manifest.version !== 2) {
      throw new BadRequestException(
        `Unsupported backup version: ${manifest.version}. Expected version 2 (JSON format).`,
      );
    }

    // 3. Extract data.json
    const dataEntry = zip.getEntry('data.json');
    if (!dataEntry) {
      throw new BadRequestException('Invalid backup: missing data.json');
    }

    const dataStr = dataEntry.getData().toString('utf8');

    // 4. Validate checksum
    if (manifest.dataChecksum) {
      const actualChecksum = crypto
        .createHash('sha256')
        .update(dataStr)
        .digest('hex');
      if (actualChecksum !== manifest.dataChecksum) {
        throw new BadRequestException(
          'Data checksum mismatch -- file may be corrupted',
        );
      }
    }

    let data: Record<string, unknown[]>;
    try {
      data = JSON.parse(dataStr);
    } catch {
      throw new BadRequestException('Invalid data.json');
    }

    // 5. Import data using Prisma transaction — delete all then create in FK order
    const stats: Record<string, number> = {};

    await this.prisma.$transaction(
      async (tx) => {
        // Delete in reverse FK order
        for (const table of [...EXPORT_TABLES].reverse()) {
          await (tx[table] as any).deleteMany();
        }

        // Create in FK order
        for (const table of EXPORT_TABLES) {
          const rows = data[table];
          if (!rows || rows.length === 0) {
            stats[table] = 0;
            continue;
          }

          // Convert date strings back to Date objects and BigInt fields
          const processed = rows.map((row: any) =>
            this.processRowForImport(table, row),
          );

          await (tx[table] as any).createMany({ data: processed });
          stats[table] = rows.length;
        }
      },
      { timeout: 120000 },
    );

    // 6. Handle assets if present
    let assetCount = 0;
    const assetsEntries = zip
      .getEntries()
      .filter(
        (e) => e.entryName.startsWith('assets/') && !e.isDirectory,
      );

    if (assetsEntries.length > 0) {
      // Backup current assets directory
      const backupTimestamp = Date.now();
      if (fs.existsSync(this.assetsDir)) {
        const bakDir = `${this.assetsDir}.${backupTimestamp}.bak`;
        try {
          fs.renameSync(this.assetsDir, bakDir);
        } catch {
          this.logger.warn('Failed to backup existing assets directory');
          warnings.push('Could not backup existing assets directory');
        }
      }
      fs.mkdirSync(this.assetsDir, { recursive: true });

      for (const entry of assetsEntries) {
        const relativePath = entry.entryName.replace(/^assets\//, '');
        const targetPath = path.join(this.assetsDir, relativePath);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, entry.getData());
        assetCount++;
      }
    }

    this.logger.log(
      `Import complete: ${Object.values(stats).reduce((a, b) => a + b, 0)} rows, ${assetCount} assets`,
    );

    return {
      success: true,
      stats: { ...stats, assetsImported: assetCount },
      warnings,
    };
  }

  private processRowForImport(
    table: TableName,
    row: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...row };

    // Convert ISO date strings back to Date objects
    const dateFields = [
      'created_at',
      'updated_at',
      'due_date',
      'completed_at',
      'next_due',
      'started_at',
      'finished_at',
      'scheduled_at',
      'published_at',
      'paid_at',
      'expires_at',
      'synced_at',
    ];
    for (const field of dateFields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = new Date(result[field] as string);
      }
    }

    // Convert BigInt fields
    if (table === 'youtube_channels' && result.view_count != null) {
      result.view_count = BigInt(result.view_count as string);
    }
    if (table === 'assets' && result.size_bytes != null) {
      result.size_bytes = BigInt(result.size_bytes as string);
    }

    // Convert Decimal fields
    if (table === 'sponsorships' && result.amount != null) {
      // Prisma accepts string or number for Decimal
      result.amount = String(result.amount);
    }

    return result;
  }

  private countAssetsRecursive(
    dir: string,
    onFile: (size: number) => void,
  ): void {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.countAssetsRecursive(fullPath, onFile);
      } else {
        onFile(fs.statSync(fullPath).size);
      }
    }
  }
}
