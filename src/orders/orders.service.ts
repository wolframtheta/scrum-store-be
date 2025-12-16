import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, PaymentStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { ArticlesService } from '../articles/articles.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private articlesService: ArticlesService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    // Calculate item totals and overall total
    const itemsWithTotals = createOrderDto.items.map(item => ({
      articleId: item.articleId,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      totalPrice: item.quantity * item.pricePerUnit
    }));

    const totalPrice = itemsWithTotals.reduce((sum, item) => 
      sum + item.totalPrice, 0
    );

    const order = this.ordersRepository.create({
      userId: userId,
      consumerGroupId: createOrderDto.consumerGroupId,
      items: itemsWithTotals,
      totalPrice,
      paidAmount: 0,
      paymentStatus: PaymentStatus.UNPAID,
      isDelivered: false
    });
    
    const savedOrder = await this.ordersRepository.save(order);
    return this.toResponseDto(savedOrder);
  }

  async findUserOrders(userId: string, consumerGroupId?: string): Promise<OrderResponseDto[]> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.user_id = :userId', { userId });

    if (consumerGroupId) {
      queryBuilder.andWhere('order.consumer_group_id = :consumerGroupId', { consumerGroupId });
    }

    queryBuilder.orderBy('order.created_at', 'DESC');

    const orders = await queryBuilder.getMany();
    return Promise.all(orders.map(order => this.enrichOrderWithArticles(order)));
  }

  async findByGroup(groupId: string, paymentStatus?: PaymentStatus): Promise<OrderResponseDto[]> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .where('order.consumer_group_id = :groupId', { groupId });

    if (paymentStatus) {
      queryBuilder.andWhere('order.payment_status = :paymentStatus', { paymentStatus });
    }

    queryBuilder.orderBy('order.created_at', 'DESC');

    const orders = await queryBuilder.getMany();
    return Promise.all(orders.map(order => this.enrichOrderWithArticles(order)));
  }

  async findOne(id: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id, userId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return this.enrichOrderWithArticles(order);
  }

  async updateDelivery(id: string, isDelivered: boolean): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({ where: { id } });

    if (!order) {
      throw new Error('Order not found');
    }

    order.isDelivered = isDelivered;
    const updatedOrder = await this.ordersRepository.save(order);
    
    return this.toResponseDto(updatedOrder);
  }

  private async enrichOrderWithArticles(order: Order): Promise<OrderResponseDto> {
    const itemsWithArticles = await Promise.all(
      order.items.map(async (item: any) => {
        try {
          const article = await this.articlesService.findById(item.articleId);
          return {
            articleId: item.articleId,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.totalPrice || (item.quantity * item.pricePerUnit),
            article: article
          };
        } catch (error) {
          console.error(`Error fetching article ${item.articleId}:`, error);
          // Return item without article info if fetch fails
          return {
            articleId: item.articleId,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.totalPrice || (item.quantity * item.pricePerUnit),
            article: null
          };
        }
      })
    );

    return {
      id: order.id,
      userId: order.userId,
      userName: order.user ? `${order.user.name} ${order.user.surname}` : undefined,
      userEmail: order.user?.email,
      consumerGroupId: order.consumerGroupId,
      items: itemsWithArticles,
      totalPrice: Number(order.totalPrice),
      paidAmount: Number(order.paidAmount || 0),
      paymentStatus: order.paymentStatus,
      isDelivered: order.isDelivered,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  private toResponseDto(order: Order): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      consumerGroupId: order.consumerGroupId,
      items: order.items,
      totalPrice: Number(order.totalPrice),
      paidAmount: Number(order.paidAmount || 0),
      paymentStatus: order.paymentStatus,
      isDelivered: order.isDelivered,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }
}

