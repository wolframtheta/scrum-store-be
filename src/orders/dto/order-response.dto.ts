import { OrderStatus } from '../entities/order.entity';

export class OrderResponseDto {
  id: string;
  userId: string;
  consumerGroupId: string;
  items: any[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt?: Date;
}



