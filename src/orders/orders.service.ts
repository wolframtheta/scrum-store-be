import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
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
      status: OrderStatus.PENDING
    });
    
    const savedOrder = await this.ordersRepository.save(order);
    return this.toResponseDto(savedOrder);
  }

  async findUserOrders(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.ordersRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });

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

  /**
   * Enrich order with full article information
   */
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
      consumerGroupId: order.consumerGroupId,
      items: itemsWithArticles,
      totalPrice: Number(order.totalPrice),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  async updateStatus(id: string, userId: string, status: OrderStatus): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id, userId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    const updatedOrder = await this.ordersRepository.save(order);
    
    return this.toResponseDto(updatedOrder);
  }

  private toResponseDto(order: Order): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      consumerGroupId: order.consumerGroupId,
      items: order.items,
      totalPrice: Number(order.totalPrice),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }
}

