import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { PeriodRecurrence } from '../entities/period.entity';

export class PeriodArticleResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  articleId: string;

  @ApiPropertyOptional()
  @Expose()
  article?: {
    id: string;
    product: string;
    variety?: string;
    unitMeasure: string;
  };

  @ApiProperty()
  @Expose()
  pricePerUnit: number;
}

export class PeriodResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  supplierId: string;

  @ApiPropertyOptional()
  @Expose()
  supplier?: {
    id: string;
    name: string;
  };

  @ApiProperty()
  @Expose()
  startDate: Date;

  @ApiProperty()
  @Expose()
  endDate: Date;

  @ApiProperty()
  @Expose()
  deliveryDate: Date;

  @ApiProperty({ enum: PeriodRecurrence })
  @Expose()
  recurrence: PeriodRecurrence;

  @ApiPropertyOptional({ example: 25.50, description: 'Cost de transport per aquest període' })
  @Expose()
  transportCost?: number;

  @ApiPropertyOptional({ type: [PeriodArticleResponseDto] })
  @Expose()
  @Type(() => PeriodArticleResponseDto)
  periodArticles?: PeriodArticleResponseDto[];

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<PeriodResponseDto>) {
    Object.assign(this, partial);
  }
}

