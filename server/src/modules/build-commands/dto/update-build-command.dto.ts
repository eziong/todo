import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateBuildCommandDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  url?: string;

  @IsOptional()
  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  method?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsString()
  bodyTemplate?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}
