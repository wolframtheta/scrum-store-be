import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsEmail, IsOptional } from 'class-validator';

export class SetBasketScheduleVoteDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Vote status', enum: ['yes', 'no', 'if_needed'] })
  @IsIn(['yes', 'no', 'if_needed'])
  status: 'yes' | 'no' | 'if_needed';

  /** Manager only: set vote on behalf of this user. If omitted, vote is for the current user. */
  @ApiPropertyOptional({ description: 'User email (manager only)' })
  @IsOptional()
  @IsEmail()
  userEmail?: string;
}
