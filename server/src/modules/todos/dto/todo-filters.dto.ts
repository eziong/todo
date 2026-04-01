import { IsOptional, IsString } from 'class-validator';

export class TodoFiltersDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
