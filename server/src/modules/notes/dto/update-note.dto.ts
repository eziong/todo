import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string | null;

  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsUUID()
  projectId?: string | null;
}
