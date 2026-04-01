import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContentChecklistDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsInt()
  position?: number;
}
