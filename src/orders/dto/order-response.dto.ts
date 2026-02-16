import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { PaymentStatus } from '../entities/order.entity';
import { ArticleResponseDto } from '../../articles/dto/article-response.dto';

@Exclude()
export class PeriodInfoDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  supplierId: string;

  @ApiProperty()
  @Expose()
  startDate: Date | string;

  @ApiProperty()
  @Expose()
  endDate: Date | string;

  @ApiProperty()
  @Expose()
  deliveryDate: Date | string;

  constructor(partial: Partial<PeriodInfoDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class OrderItemResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiPropertyOptional()
  @Expose()
  articleId: string | null;

  @ApiPropertyOptional({ type: ArticleResponseDto })
  @Expose()
  @Type(() => ArticleResponseDto)
  article?: ArticleResponseDto;

  @ApiPropertyOptional()
  @Expose()
  periodId?: string;

  @ApiPropertyOptional({ type: PeriodInfoDto })
  @Expose()
  @Type(() => PeriodInfoDto)
  period?: PeriodInfoDto;

  @ApiProperty({ example: 2.5 })
  @Expose()
  quantity: number;

  @ApiProperty({ example: 4.5 })
  @Expose()
  pricePerUnit: number;

  @ApiProperty({ example: 11.25 })
  @Expose()
  totalPrice: number;

  @ApiProperty({ example: false, description: 'Indica si aquest item ha estat preparat per a la seva entrega' })
  @Expose()
  isPrepared: boolean;

  @ApiPropertyOptional({ type: 'array', description: 'Opciones de personalización seleccionadas' })
  @Expose()
  selectedOptions?: any[];

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

  @ApiPropertyOptional({ example: 2.50, description: 'Cost de transport repartit per aquesta comanda' })
  @Expose()
  transportCost?: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAID })
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
