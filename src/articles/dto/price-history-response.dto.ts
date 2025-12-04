import { ApiProperty } from '@nestjs/swagger';

export class PriceHistoryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 4.5 })
  pricePerUnit: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  changedAt: Date;

  constructor(partial: Partial<PriceHistoryResponseDto>) {
    Object.assign(this, partial);
  }
}


