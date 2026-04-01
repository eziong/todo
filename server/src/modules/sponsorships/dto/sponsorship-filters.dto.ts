import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class SponsorshipFiltersDto {
  @IsOptional()
  @IsIn(['negotiating', 'confirmed', 'delivered', 'paid', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsUUID()
  contentId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
