import { IsOptional, IsString } from 'class-validator';

export class NotificationFiltersDto {
  @IsOptional()
  @IsString()
  source?: string;
}
