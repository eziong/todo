import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyCommentDto {
  @IsNotEmpty()
  @IsString()
  commentId: string;

  @IsNotEmpty()
  @IsString()
  text: string;
}
