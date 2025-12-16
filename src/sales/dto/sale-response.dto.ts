import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { PaymentStatus } from '../entities/sale.entity';
import { ArticleResponseDto } from '../../articles/dto/article-response.dto';

@Exclude()
export class SaleItemResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  articleId: string;

  @ApiPropertyOptional({ type: ArticleResponseDto })
  @Expose()
  @Type(() => ArticleResponseDto)
  article?: ArticleResponseDto;

  @ApiProperty({ example: 2.5 })
  @Expose()
  quantity: number;

  @ApiProperty({ example: 4.5 })
  @Expose()
  pricePerUnit: number;

  @ApiProperty({ example: 11.25 })
  @Expose()
  totalPrice: number;

  @ApiProperty({ example: 0 })
  @Expose()
  paidAmount: number;

  constructor(partial: Partial<SaleItemResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class SaleResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userEmail: string;

  @ApiProperty({ required: false })
  @Expose()
  userName?: string;

  @ApiProperty()
  @Expose()
  consumerGroupId: string;

  @ApiProperty({ type: [SaleItemResponseDto] })
  @Expose()
  @Type(() => SaleItemResponseDto)
  items: SaleItemResponseDto[];

  @ApiProperty({ example: 25.50 })
  @Expose()
  totalAmount: number;

  @ApiProperty({ example: 10.00 })
  @Expose()
  paidAmount: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PARTIAL })
  @Expose()
  paymentStatus: PaymentStatus;

  @ApiProperty({ example: false })
  @Expose()
  isDelivered: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<SaleResponseDto>) {
    Object.assign(this, partial);
  }
}


