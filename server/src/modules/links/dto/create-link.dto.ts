import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
