import { IsOptional, IsString } from 'class-validator';

export class UpdateNoticeDto {
  @IsOptional()
  @IsString()
  content?: string;
}
