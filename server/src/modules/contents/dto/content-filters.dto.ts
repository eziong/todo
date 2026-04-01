import { IsOptional, IsString } from 'class-validator';

export class ContentFiltersDto {
  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
