import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UnitMeasure } from '../entities/article.entity';

@Exclude()
export class ArticleResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Hortalissa' })
  @Expose()
  category: string;

  @ApiProperty({ example: 'Tomàquet' })
  @Expose()
  product: string;

  @ApiPropertyOptional({ example: 'Cherry' })
  @Expose()
  variety?: string;

  @ApiPropertyOptional({ example: 'Tomates cherry de agricultura ecológica' })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/images/articles/abc.jpg' })
  @Expose()
  image?: string;

  @ApiProperty({ enum: UnitMeasure, example: UnitMeasure.KG })
  @Expose()
  unitMeasure: UnitMeasure;

  @ApiProperty({ example: 4.5 })
  @Expose()
  pricePerUnit: number;

  @ApiPropertyOptional({ example: 'Barcelona' })
  @Expose()
  city?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  producerId?: string;

  @ApiPropertyOptional({ example: 'Productor Ecològic' })
  @Expose()
  producerName?: string;

  @ApiPropertyOptional({ example: 'Proveïdor S.L.' })
  @Expose()
  supplierName?: string;

  @ApiProperty({ example: true })
  @Expose()
  isEco: boolean;

  @ApiProperty({ example: 21 })
  @Expose()
  taxRate: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  consumerGroupId: string;

  @ApiProperty({ example: false })
  @Expose()
  inShowcase: boolean;

  @ApiProperty({ example: true })
  @Expose()
  isSeasonal: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<ArticleResponseDto>) {
    Object.assign(this, partial);
  }
}

