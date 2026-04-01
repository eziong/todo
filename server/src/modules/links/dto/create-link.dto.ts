import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
  @IsInt()
  position?: number;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
