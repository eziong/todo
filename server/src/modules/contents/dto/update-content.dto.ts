import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

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
  projectId?: string | null;

  @IsOptional()
  @IsUUID()
  noteId?: string | null;

  @IsOptional()
  @IsUUID()
  templateId?: string | null;

  @IsOptional()
  @IsString()
  scheduledAt?: string | null;

  @IsOptional()
  @IsString()
  publishedAt?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  youtubeVideoId?: string | null;
}
