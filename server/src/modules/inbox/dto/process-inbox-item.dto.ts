import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProcessInboxItemDto {
  @IsIn(['todo'])
  processedTo: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
