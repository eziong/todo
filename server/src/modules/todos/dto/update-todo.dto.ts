import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
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
  @IsString()
  position?: string;

  @IsOptional()
  @ValidateIf((o) => o.contentId !== null)
  @IsUUID()
  contentId?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.contentStage !== null)
  @IsIn(['idea', 'drafting', 'editing', 'review', 'published'])
  contentStage?: string | null;
}
