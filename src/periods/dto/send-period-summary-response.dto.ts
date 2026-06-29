import { ApiProperty } from '@nestjs/swagger';

export class SendPeriodSummaryResponseDto {
  @ApiProperty({ example: 'proveidor@example.com' })
  sentTo: string;

  @ApiProperty({ example: 'Comandes període: Setmana 12' })
  subject: string;

  @ApiProperty()
  sentAt: Date;

  constructor(partial: Partial<SendPeriodSummaryResponseDto>) {
    Object.assign(this, partial);
  }
}
