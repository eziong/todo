import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  sizeBytes: number;

  @IsString()
  @IsNotEmpty()
  storageType: string;

  @IsString()
  @IsNotEmpty()
  storagePath: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string | null;

  @IsOptional()
  @IsUUID()
  contentId?: string | null;

  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
