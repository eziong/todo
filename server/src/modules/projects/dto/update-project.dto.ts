import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

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
  @IsInt()
  position?: number;

  @IsOptional()
  @IsString()
  githubRepo?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
