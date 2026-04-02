import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsOptional()
  @IsString()
  icon?: string | null;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  githubRepo?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
