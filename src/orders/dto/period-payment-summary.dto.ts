import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { PaymentStatus } from '../entities/order.entity';

@Exclude()
export class UserPaymentSummaryDto {
  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty()
  @Expose()
  userName: string;

  @ApiProperty({ example: 125.50, description: 'Suma del subtotal de totes les comandes del període' })
  @Expose()
  subtotal: number;

  @ApiProperty({ example: 5.25, description: 'Cost de transport repartit per aquest període' })
  @Expose()
  transportCost: number;

  @ApiProperty({ example: 130.75, description: 'Total a pagar (subtotal + transport)' })
  @Expose()
  total: number;

  @ApiProperty({ example: 3, description: 'Nombre de comandes del període' })
  @Expose()
  ordersCount: number;

  @ApiProperty({ example: 0, description: 'Quantitat pagada fins ara' })
  @Expose()
  paidAmount: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.UNPAID, description: 'Estat de pagament general' })
  @Expose()
  paymentStatus: PaymentStatus;

  @ApiProperty({ example: ['order-id-1', 'order-id-2'], description: 'IDs de les comandes del període' })
  @Expose()
  orderIds: string[];

  constructor(partial: Partial<UserPaymentSummaryDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class PeriodPaymentSummaryDto {
  @ApiProperty()
  @Expose()
  periodId: string;

  @ApiProperty()
  @Expose()
  periodName: string;

  @ApiProperty({ type: [UserPaymentSummaryDto] })
  @Expose()
  users: UserPaymentSummaryDto[];

  @ApiProperty({ example: 500.00, description: 'Total de tots els subtotals' })
  @Expose()
  totalSubtotal: number;

  @ApiProperty({ example: 25.50, description: 'Cost total de transport del període' })
  @Expose()
  totalTransportCost: number;

  @ApiProperty({ example: 525.50, description: 'Total general (subtotal + transport)' })
  @Expose()
  grandTotal: number;

  constructor(partial: Partial<PeriodPaymentSummaryDto>) {
    Object.assign(this, partial);
  }
}
