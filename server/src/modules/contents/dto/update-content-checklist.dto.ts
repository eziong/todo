import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateContentChecklistDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  checked?: boolean;

  @IsOptional()
  @IsInt()
  position?: number;
}
