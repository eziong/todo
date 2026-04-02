import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLinkDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  category?: string | null;

  @IsOptional()
  @IsString()
  position?: string | null;

  @IsOptional()
  @IsUUID()
  projectId?: string | null;
}
