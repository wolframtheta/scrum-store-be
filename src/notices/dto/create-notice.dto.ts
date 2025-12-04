import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateNoticeDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsUUID()
  groupId: string;
}
