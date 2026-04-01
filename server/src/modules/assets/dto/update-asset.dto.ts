import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  filename?: string;

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
