import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsIn(['video', 'short', 'blog', 'podcast', 'newsletter'])
  type?: string;

  @IsOptional()
  @IsIn(['idea', 'drafting', 'editing', 'review', 'published'])
  stage?: string;

  @IsOptional()
  @IsIn([
    'youtube',
    'blog',
    'newsletter',
    'podcast',
    'instagram',
    'tiktok',
    'twitter',
  ])
  platform?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  noteId?: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
