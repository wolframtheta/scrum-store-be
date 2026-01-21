import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto, OrderItemResponseDto } from './dto/order-response.dto';
import { ArticlesService } from '../articles/articles.service';
import { ConsumerGroupsService } from '../consumer-groups/consumer-groups.service';
import { UsersService } from '../users/users.service';
import { ArticleResponseDto } from '../articles/dto/article-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    private readonly articlesService: ArticlesService,
    private readonly consumerGroupsService: ConsumerGroupsService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  private mapOrderItemToDto(item: OrderItem): OrderItemResponseDto {
    return new OrderItemResponseDto({
      id: item.id,
      articleId: item.articleId,
      article: item.article ? new ArticleResponseDto(item.article) : undefined,
      periodId: item.periodId || undefined,
      period: item.period ? {
        id: item.period.id,
        name: item.period.name,
        supplierId: item.period.supplierId,
        startDate: item.period.startDate,
        endDate: item.period.endDate,
        deliveryDate: item.period.deliveryDate,
      } : undefined,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      totalPrice: item.totalPrice,
      paidAmount: item.paidAmount,
    });
  }

  async create(userId: string, createDto: CreateOrderDto): Promise<OrderResponseDto> {
    // Get user to verify it exists
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify user is member of the group
    const isMember = await this.consumerGroupsService.isMember(user.email, createDto.consumerGroupId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this consumer group');
    }

    if (!createDto.items || createDto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Use transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fetch all articles
      const articleIds = createDto.items.map(item => item.articleId);
      const articles = await Promise.all(
        articleIds.map(id => this.articlesService.findById(id))
      );

      // Verify all articles belong to the same consumer group
      for (const article of articles) {
        if (article.consumerGroupId !== createDto.consumerGroupId) {
          throw new BadRequestException(`Article ${article.id} does not belong to this consumer group`);
        }
        
        if (!article.inShowcase) {
          throw new BadRequestException(`Article ${article.id} is not in showcase`);
        }
      }

      // Create order
      const order = this.ordersRepository.create({
        userId,
        consumerGroupId: createDto.consumerGroupId,
        totalAmount: 0,
        paidAmount: 0,
        paymentStatus: PaymentStatus.UNPAID,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Create order items
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of createDto.items) {
        const article = articles.find(a => a.id === itemDto.articleId);
        if (!article) {
          throw new NotFoundException(`Article ${itemDto.articleId} not found`);
        }

        const totalPrice = Number((Number(article.pricePerUnit) * itemDto.quantity).toFixed(2));
        totalAmount += totalPrice;

        const orderItem = this.orderItemsRepository.create({
          orderId: savedOrder.id,
          articleId: article.id,
          periodId: itemDto.orderPeriodId || null,
          quantity: itemDto.quantity,
          pricePerUnit: article.pricePerUnit,
          totalPrice,
          paidAmount: 0,
        });

        orderItems.push(orderItem);
      }

      await queryRunner.manager.save(orderItems);

      // Update total amount
      savedOrder.totalAmount = totalAmount;
      await queryRunner.manager.save(savedOrder);

      await queryRunner.commitTransaction();

      // Reload order with items
      const completeOrder = await this.ordersRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.article', 'items.period', 'user'],
      });

      if (!completeOrder) {
        throw new NotFoundException('Order not found after creation');
      }

      return new OrderResponseDto({
        ...completeOrder,
        userName: completeOrder.user ? `${completeOrder.user.name} ${completeOrder.user.surname}` : undefined,
        items: completeOrder.items.map(item => this.mapOrderItemToDto(item)),
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findUserOrders(userId: string, groupId?: string): Promise<OrderResponseDto[]> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.article', 'article')
      .leftJoinAndSelect('items.period', 'period')
      .leftJoinAndSelect('order.user', 'user')
      .where('order.user_id = :userId', { userId });

    if (groupId) {
      queryBuilder.andWhere('order.consumer_group_id = :groupId', { groupId });
    }

    queryBuilder.orderBy('order.created_at', 'DESC');

    const orders = await queryBuilder.getMany();

    return orders.map(order => {
      // Filter out items with null articleId (deleted items)
      const validItems = (order.items || []).filter(item => item && item.articleId !== null && item.articleId !== undefined);
      
      return new OrderResponseDto({
        ...order,
        userName: order.user ? `${order.user.name} ${order.user.surname}` : undefined,
        items: validItems.map(item => this.mapOrderItemToDto(item)),
      });
    });
  }

  async findOne(id: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.article', 'items.period', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Verify user has access (owner or manager)
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOwner = order.userId === userId;
    const isManager = await this.consumerGroupsService.isManager(user.email, order.consumerGroupId);
    
    if (!isOwner && !isManager) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Filter out items with null articleId (deleted items)
    const validItems = (order.items || []).filter(item => item && item.articleId !== null && item.articleId !== undefined);
    
    return new OrderResponseDto({
      ...order,
      userName: order.user ? `${order.user.name} ${order.user.surname}` : undefined,
      items: validItems.map(item => this.mapOrderItemToDto(item)),
    });
  }

  async findByGroup(groupId: string, paymentStatus?: PaymentStatus): Promise<OrderResponseDto[]> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.article', 'article')
      .leftJoinAndSelect('items.period', 'period')
      .leftJoinAndSelect('order.user', 'user')
      .where('order.consumer_group_id = :groupId', { groupId });

    if (paymentStatus) {
      queryBuilder.andWhere('order.payment_status = :paymentStatus', { paymentStatus });
    }

    queryBuilder.orderBy('order.created_at', 'DESC');

    const orders = await queryBuilder.getMany();

    return orders.map(order => {
      // Filter out items with null articleId (deleted items)
      const validItems = (order.items || []).filter(item => item && item.articleId !== null && item.articleId !== undefined);
      
      return new OrderResponseDto({
        ...order,
        userName: order.user ? `${order.user.name} ${order.user.surname}` : undefined,
        items: validItems.map(item => this.mapOrderItemToDto(item)),
      });
    });
  }

  async updateDelivery(id: string, isDelivered: boolean): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.period', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    order.isDelivered = isDelivered;
    await this.ordersRepository.save(order);

    // Filter out items with null articleId (deleted items)
    const validItems = (order.items || []).filter(item => item && item.articleId !== null && item.articleId !== undefined);

    return new OrderResponseDto({
      ...order,
      userName: order.user ? `${order.user.name} ${order.user.surname}` : undefined,
      items: validItems.map(item => this.mapOrderItemToDto(item)),
    });
  }

  async markAsPaid(id: string): Promise<OrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id },
        relations: ['items', 'items.article', 'items.period', 'user'],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Calculate total with tax for each item
      const validItems = (order.items || []).filter(item => item && item.articleId !== null && item.articleId !== undefined);
      
      let totalPaid = 0;
      for (const item of validItems) {
        const itemSubtotal = Number(item.totalPrice || 0);
        const taxRate = item.article?.taxRate ? Number(item.article.taxRate) : 0;
        const itemTax = itemSubtotal * (taxRate / 100);
        const itemTotalWithTax = itemSubtotal + itemTax;
        
        // Mark item as fully paid
        item.paidAmount = Number(itemTotalWithTax.toFixed(2));
        totalPaid += itemTotalWithTax;
      }

      // Update order payment status
      order.paidAmount = Number(totalPaid.toFixed(2));
      order.paymentStatus = PaymentStatus.PAID;

      // Save items and order
      await queryRunner.manager.save(validItems);
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // Reload order with all relations
      const updatedOrder = await this.ordersRepository.findOne({
        where: { id },
        relations: ['items', 'items.article', 'items.period', 'user'],
      });

      if (!updatedOrder) {
        throw new NotFoundException('Order not found after marking as paid');
      }

      const reloadedValidItems = (updatedOrder.items || []).filter(item => item && item.articleId !== null && item.articleId !== undefined);

      return new OrderResponseDto({
        ...updatedOrder,
        userName: updatedOrder.user ? `${updatedOrder.user.name} ${updatedOrder.user.surname}` : undefined,
        items: reloadedValidItems.map(item => this.mapOrderItemToDto(item)),
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string): Promise<void> {
    const order = await this.ordersRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Los order_items se borrarán automáticamente por CASCADE
    await this.ordersRepository.remove(order);
  }

  async deleteOrderItemById(orderId: string, itemId: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.article', 'items.period', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Find the specific order item by ID
    const itemToDelete = order.items.find(item => item.id === itemId);
    if (!itemToDelete) {
      throw new NotFoundException(`Order item with ID ${itemId} not found in order ${orderId}`);
    }

    // Use transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Calculate paid amount to subtract from order
      const paidAmountToSubtract = Number(itemToDelete.paidAmount || 0);
      
      // Remove the item from the order's items array
      order.items = order.items.filter(item => item.id !== itemId);
      
      // Delete the item using remove method within the transaction
      await queryRunner.manager.remove(itemToDelete);

      // Si no queden items, eliminar la comanda completament
      if (order.items.length === 0) {
        await queryRunner.manager.remove(order);
        await queryRunner.commitTransaction();
        
        // Return an empty order to signal deletion
        return new OrderResponseDto({
          ...order,
          items: [],
          totalAmount: 0,
          paidAmount: 0,
          userName: order.user ? `${order.user.name} ${order.user.surname}` : undefined,
        });
      }

      // Recalculate total amount and paid amount
      const remainingItems = order.items;
      const newTotalAmount = remainingItems.reduce((sum, item) => {
        return sum + Number(item.totalPrice);
      }, 0);
      
      // Recalculate paid amount: subtract the paid amount of deleted item
      const currentPaidAmount = Number(order.paidAmount || 0);
      const newPaidAmount = Math.max(0, currentPaidAmount - paidAmountToSubtract);

      // Update order amounts
      order.totalAmount = Number(newTotalAmount.toFixed(2));
      order.paidAmount = Number(newPaidAmount.toFixed(2));
      
      // Recalculate payment status
      if (newTotalAmount === 0) {
        order.paymentStatus = PaymentStatus.UNPAID;
      } else if (newPaidAmount === 0) {
        order.paymentStatus = PaymentStatus.UNPAID;
      } else if (newPaidAmount >= newTotalAmount) {
        order.paymentStatus = PaymentStatus.PAID;
      } else {
        order.paymentStatus = PaymentStatus.PARTIAL;
      }
      
      // Save the order with updated items and amounts
      const savedOrder = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // Reload order with all relations to ensure we have fresh data
      const updatedOrder = await this.ordersRepository.findOne({
        where: { id: orderId },
        relations: ['items', 'items.article', 'items.period', 'user'],
      });

      if (!updatedOrder) {
        throw new NotFoundException('Order not found after deletion');
      }

      // Filter out items with null articleId (deleted items)
      const validItems = (updatedOrder.items || []).filter(item => item && item.articleId !== null && item.articleId !== undefined);

      return new OrderResponseDto({
        ...updatedOrder,
        userName: updatedOrder.user ? `${updatedOrder.user.name} ${updatedOrder.user.surname}` : undefined,
        items: validItems.map(item => this.mapOrderItemToDto(item)),
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Keep the old method for backward compatibility, but it now uses the new method
  async deleteOrderItem(orderId: string, articleId: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.article', 'items.period', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Find all order items with this articleId to delete
    // Handle case where articleId might be null (if article was deleted from catalog)
    const itemsToDelete = order.items.filter(item => 
      item.articleId === articleId || (item.articleId === null && articleId === null)
    );
    
    if (itemsToDelete.length === 0) {
      throw new NotFoundException(`Order items with article ID ${articleId} not found in order ${orderId}`);
    }

    // Delete the first matching item (or all if needed)
    // For now, delete the first one to maintain backward compatibility
    return this.deleteOrderItemById(orderId, itemsToDelete[0].id);
  }
}
