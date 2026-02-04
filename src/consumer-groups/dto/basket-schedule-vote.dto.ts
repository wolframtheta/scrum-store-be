import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn } from 'class-validator';

export class SetBasketScheduleVoteDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Vote status', enum: ['yes', 'no', 'if_needed'] })
  @IsIn(['yes', 'no', 'if_needed'])
  status: 'yes' | 'no' | 'if_needed';
}
