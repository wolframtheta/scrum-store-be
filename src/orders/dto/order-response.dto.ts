import { OrderStatus, PaymentStatus } from '../entities/order.entity';

export class OrderResponseDto {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  consumerGroupId: string;
  items: any[];
  totalPrice: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  isDelivered: boolean;
  status: OrderStatus;
  createdAt: Date;
  updatedAt?: Date;
}







