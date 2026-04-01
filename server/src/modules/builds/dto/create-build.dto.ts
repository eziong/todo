import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateBuildDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsString()
  command?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  buildCommandId?: string;
}
