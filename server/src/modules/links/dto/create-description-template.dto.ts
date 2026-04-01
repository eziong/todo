import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDescriptionTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
