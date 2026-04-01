import { Injectable, NotFoundException } from '@nestjs/common';
import { google, type drive_v3 } from 'googleapis';
import { Readable } from 'stream';

export interface DriveFileResponse {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  thumbnailLink: string | null;
  createdTime: string;
}

export interface DriveFileListResponse {
  files: DriveFileResponse[];
  nextPageToken: string | null;
}

export interface DriveFileUrlResponse {
  webViewLink: string;
  webContentLink: string | null;
}

@Injectable()
export class DriveService {
  private getDriveClient(accessToken: string): drive_v3.Drive {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  async listFiles(
    accessToken: string,
    options?: { pageToken?: string; maxResults?: number; mimeType?: string },
  ): Promise<DriveFileListResponse> {
    const drive = this.getDriveClient(accessToken);
    const pageSize = options?.maxResults ?? 20;

    let q = 'trashed = false';
    if (options?.mimeType) {
      q += ` and mimeType contains '${options.mimeType}'`;
    }

    const res = await drive.files.list({
      pageSize,
      pageToken: options?.pageToken ?? undefined,
      q,
      fields:
        'nextPageToken, files(id, name, mimeType, size, thumbnailLink, createdTime)',
      orderBy: 'createdTime desc',
      spaces: 'drive',
    });

    const files: DriveFileResponse[] = (res.data.files ?? []).map((file) => ({
      id: file.id ?? '',
      name: file.name ?? '',
      mimeType: file.mimeType ?? '',
      size: Number(file.size ?? 0),
      thumbnailLink: file.thumbnailLink ?? null,
      createdTime: file.createdTime ?? '',
    }));

    return {
      files,
      nextPageToken: res.data.nextPageToken ?? null,
    };
  }

  async uploadFile(
    accessToken: string,
    fileBuffer: Buffer,
    metadata: { name: string; mimeType: string },
  ): Promise<DriveFileResponse> {
    const drive = this.getDriveClient(accessToken);
    const stream = Readable.from(fileBuffer);

    const res = await drive.files.create({
      requestBody: {
        name: metadata.name,
        mimeType: metadata.mimeType,
      },
      media: {
        mimeType: metadata.mimeType,
        body: stream,
      },
      fields: 'id, name, mimeType, size, thumbnailLink, createdTime',
    });

    return {
      id: res.data.id ?? '',
      name: res.data.name ?? '',
      mimeType: res.data.mimeType ?? '',
      size: Number(res.data.size ?? 0),
      thumbnailLink: res.data.thumbnailLink ?? null,
      createdTime: res.data.createdTime ?? '',
    };
  }

  async getFileUrl(
    accessToken: string,
    fileId: string,
  ): Promise<DriveFileUrlResponse> {
    const drive = this.getDriveClient(accessToken);

    const res = await drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink',
    });

    if (!res.data.webViewLink) {
      throw new NotFoundException(`Drive file ${fileId} not found`);
    }

    return {
      webViewLink: res.data.webViewLink ?? '',
      webContentLink: res.data.webContentLink ?? null,
    };
  }

  async deleteFile(accessToken: string, fileId: string): Promise<void> {
    const drive = this.getDriveClient(accessToken);
    await drive.files.delete({ fileId });
  }
}
