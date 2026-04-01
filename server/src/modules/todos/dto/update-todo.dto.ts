import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'completed'])
  status?: string;

  @IsOptional()
  @IsIn(['none', 'low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  dueDate?: string | null;

  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @IsOptional()
  @IsInt()
  position?: number;
}
