import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'completed'])
  status?: string;

  @IsOptional()
  @IsIn(['none', 'low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}
