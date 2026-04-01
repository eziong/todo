import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AssetFiltersDto {
  @IsOptional()
  @IsUUID()
  contentId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  storageType?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
