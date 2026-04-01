import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSponsorshipDto {
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsNumber()
  amount: number;

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
}
