import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(['public', 'unlisted', 'private'])
  privacyStatus?: string;
}
