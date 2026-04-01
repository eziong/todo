import { IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateSponsorshipDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsIn(['negotiating', 'confirmed', 'delivered', 'paid', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsUUID()
  contentId?: string | null;

  @IsOptional()
  @IsString()
  contactInfo?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  paidAt?: string | null;
}
