import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ReorderContentItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsIn(['idea', 'drafting', 'editing', 'review', 'published'])
  stage: string;

  @IsInt()
  @Min(0)
  position: number;
}

export class ReorderContentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderContentItemDto)
  items: ReorderContentItemDto[];
}
