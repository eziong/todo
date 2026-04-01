import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DriveListFiltersDto {
  @IsOptional()
  @IsString()
  pageToken?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxResults?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;
}
