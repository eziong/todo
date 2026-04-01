import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateNoteFolderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsInt()
  position?: number;
}
