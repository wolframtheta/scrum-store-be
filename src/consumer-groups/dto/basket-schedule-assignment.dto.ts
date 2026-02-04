import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail } from 'class-validator';

export class SetBasketScheduleAssignmentDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Email of the preparer assigned for this day' })
  @IsEmail()
  assignedUserEmail: string;
}
