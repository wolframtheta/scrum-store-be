import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { PaymentStatus } from '../entities/order.entity';
import { ArticleResponseDto } from '../../articles/dto/article-response.dto';

@Exclude()
export class OrderItemResponseDto {
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

  constructor(partial: Partial<OrderItemResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class OrderResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiPropertyOptional()
  @Expose()
  userName?: string;

  @ApiProperty()
  @Expose()
  consumerGroupId: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  @Expose()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];

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

  constructor(partial: Partial<OrderResponseDto>) {
    Object.assign(this, partial);
  }
}
