import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDescriptionTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
