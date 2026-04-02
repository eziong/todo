import { IsOptional, IsString } from 'class-validator';

export class UpsertStageDataDto {
  @IsOptional()
  @IsString()
  description?: string | null;
}
