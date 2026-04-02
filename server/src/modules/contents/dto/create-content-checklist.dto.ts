import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContentChecklistDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsIn(['idea', 'drafting', 'editing', 'review', 'published'])
  stage?: string;

  @IsOptional()
  @IsInt()
  position?: number;
}
