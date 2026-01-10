import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ShowcaseArticleItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  articleId: string;

  @ApiProperty()
  @Expose()
  product: string;

  @ApiPropertyOptional()
  @Expose()
  variety?: string;

  @ApiPropertyOptional()
  @Expose()
  category?: string;

  @ApiProperty()
  @Expose()
  pricePerUnit: number;

  @ApiProperty()
  @Expose()
  unitMeasure: string;

  @ApiPropertyOptional()
  @Expose()
  image?: string;

  @ApiPropertyOptional()
  @Expose()
  producerName?: string;

  @ApiProperty()
  @Expose()
  isAvailable: boolean;

  @ApiPropertyOptional()
  @Expose()
  isEco?: boolean;

  @ApiProperty()
  @Expose()
  isSeasonal: boolean;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiPropertyOptional()
  @Expose()
  city?: string;

  @ApiPropertyOptional()
  @Expose()
  taxRate?: number;
}

export class ShowcasePeriodDto {
  @ApiProperty()
  @Expose()
  periodId: string;

  @ApiProperty()
  @Expose()
  periodName: string;

  @ApiProperty()
  @Expose()
  deliveryDate: Date | string;

  @ApiProperty()
  @Expose()
  startDate: Date | string;

  @ApiProperty()
  @Expose()
  endDate: Date | string;

  @ApiProperty({ enum: ['open', 'closed', 'processing', 'delivered'] })
  @Expose()
  status: 'open' | 'closed' | 'processing' | 'delivered';

  @ApiProperty({ type: [ShowcaseArticleItemDto] })
  @Expose()
  articles: ShowcaseArticleItemDto[];
}

