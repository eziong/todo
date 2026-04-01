import { IsNotEmpty, IsString } from 'class-validator';

export class SelectChannelDto {
  @IsString()
  @IsNotEmpty()
  channelId: string;
}
