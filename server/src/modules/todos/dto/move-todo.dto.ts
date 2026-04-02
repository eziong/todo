import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class MoveTodoDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsString()
  afterId?: string;

  @IsOptional()
  @IsString()
  beforeId?: string;
}
