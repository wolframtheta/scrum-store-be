import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ConsumerGroupResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'group@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'Grupo de Consumo Barcelona' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ example: 'Grupo de consumo ecológico...' })
  @Expose()
  description?: string;

  @ApiProperty({ example: 'Barcelona' })
  @Expose()
  city: string;

  @ApiPropertyOptional({ example: 'Calle Mayor 123' })
  @Expose()
  address?: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/images/groups/abc.jpg' })
  @Expose()
  image?: string;

  @ApiPropertyOptional()
  @Expose()
  openingSchedule?: any;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<ConsumerGroupResponseDto>) {
    Object.assign(this, partial);
  }
}

