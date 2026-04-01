import { IsOptional, IsString } from 'class-validator';

export class NoteFiltersDto {
  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  pinned?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
