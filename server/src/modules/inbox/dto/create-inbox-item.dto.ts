import { IsNotEmpty, IsString } from 'class-validator';

export class CreateInboxItemDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
