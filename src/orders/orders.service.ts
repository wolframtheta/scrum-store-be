import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderResponseDto, OrderItemResponseDto } from './dto/order-response.dto';
import { ArticlesService } from '../articles/articles.service';
import { ConsumerGroupsService } from '../consumer-groups/consumer-groups.service';
import { UsersService } from '../users/users.service';
import { ArticleResponseDto } from '../articles/dto/article-response.dto';
import { PeriodsService } from '../periods/periods.service';
import { PeriodPaymentSummaryDto, UserPaymentSummaryDto } from './dto/period-payment-summary.dto';

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
    private readonly periodsService: PeriodsService,
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
      selectedOptions: item.selectedOptions,
    });
  }

  /**
   * Calcula el cost de transport per una comanda.
   * Reparteix el cost de transport de cada període entre tots els usuaris únics que han fet comandes en aquell període i proveïdor.
   */
  private async calculateTransportCostForOrder(order: Order): Promise<number> {
    if (!order.items || order.items.length === 0) {
      return 0;
    }

    // Agrupar items per període
    const periodMap = new Map<string, { transportCost: number; supplierId: string }>();

    // Recopilar períodes únics amb el seu cost de transport
    for (const item of order.items) {
      if (!item.period || !item.period.transportCost) continue;

      const periodId = item.period.id;
      const transportCost = Number(item.period.transportCost);
      const supplierId = item.period.supplierId;

      if (!periodMap.has(periodId)) {
        periodMap.set(periodId, { transportCost, supplierId });
      }
    }

    if (periodMap.size === 0) {
      return 0;
    }

    // Per cada període únic, calcular la part proporcional
    let totalTransportCost = 0;

    for (const [periodId, periodInfo] of periodMap) {
      // Comptar quantes usuaris únics hi ha en aquest període i proveïdor
      const uniqueUsersInPeriod = await this.ordersRepository
        .createQueryBuilder('order')
        .innerJoin('order.items', 'item')
        .where('item.period_id = :periodId', { periodId })
        .andWhere('order.consumer_group_id = :groupId', { groupId: order.consumerGroupId })
        .select('DISTINCT order.user_id', 'userId')
        .getRawMany();

      const userCount = uniqueUsersInPeriod.length;

      if (userCount > 0) {
        // Repartir el cost entre tots els usuaris únics
        const costPerUser = periodInfo.transportCost / userCount;
        totalTransportCost += Number(costPerUser.toFixed(2));
      }
    }

    return Number(totalTransportCost.toFixed(2));
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

        // Calcular el preu base
        const basePrice = Number(article.pricePerUnit) * itemDto.quantity;
        
        // Calcular el preu de les personalitzacions
        // El preu ja ve calculat a selectedOptions.price, només cal sumar-lo
        let customizationPrice = 0;
        if (itemDto.selectedOptions && itemDto.selectedOptions.length > 0) {
          for (const selectedOption of itemDto.selectedOptions) {
            if (selectedOption.price && selectedOption.price > 0) {
              customizationPrice += selectedOption.price * itemDto.quantity;
            }
          }
        }
        
        const totalPrice = Number((basePrice + customizationPrice).toFixed(2));
        totalAmount += totalPrice;

        const orderItem = this.orderItemsRepository.create({
          orderId: savedOrder.id,
          articleId: article.id,
          periodId: itemDto.orderPeriodId || null,
          quantity: itemDto.quantity,
          pricePerUnit: article.pricePerUnit,
          totalPrice,
          paidAmount: 0,
          selectedOptions: itemDto.selectedOptions,
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

      const transportCost = await this.calculateTransportCostForOrder(completeOrder);

      return new OrderResponseDto({
        ...completeOrder,
        userName: completeOrder.user ? `${completeOrder.user.name} ${completeOrder.user.surname}` : undefined,
        items: completeOrder.items.map(item => this.mapOrderItemToDto(item)),
        transportCost,
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

    return Promise.all(orders.map(async order => {
      // Filter out items with null articleId (deleted items)
      const validItems = (order.items || []).filter(item => item && item.articleId !== null && item.articleId !== undefined);
      
      const transportCost = await this.calculateTransportCostForOrder(order);
      
      return new OrderResponseDto({
        ...order,
        userName: order.user ? `${order.user.name} ${order.user.surname}` : undefined,
        items: validItems.map(item => this.mapOrderItemToDto(item)),
        transportCost,
      });
    }));
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
    
    const transportCost = await this.calculateTransportCostForOrder(order);
    
    return new OrderResponseDto({
      ...order,
      userName: order.user ? `${order.user.name} ${order.user.surname}` : undefined,
      items: validItems.map(item => this.mapOrderItemToDto(item)),
      transportCost,
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

    return Promise.all(orders.map(async order => {
      // Filter out items with null articleId (deleted items)
      const validItems = (order.items || []).filter(item => item && item.articleId !== null && item.articleId !== undefined);
      
      const transportCost = await this.calculateTransportCostForOrder(order);
      
      return new OrderResponseDto({
        ...order,
        userName: order.user ? `${order.user.name} ${order.user.surname}` : undefined,
        items: validItems.map(item => this.mapOrderItemToDto(item)),
        transportCost,
      });
    }));
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

    const transportCost = await this.calculateTransportCostForOrder(order);

    return new OrderResponseDto({
      ...order,
      userName: order.user ? `${order.user.name} ${order.user.surname}` : undefined,
      items: validItems.map(item => this.mapOrderItemToDto(item)),
      transportCost,
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

      const transportCost = await this.calculateTransportCostForOrder(updatedOrder);

      return new OrderResponseDto({
        ...updatedOrder,
        userName: updatedOrder.user ? `${updatedOrder.user.name} ${updatedOrder.user.surname}` : undefined,
        items: reloadedValidItems.map(item => this.mapOrderItemToDto(item)),
        transportCost,
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

  async updateOrderItem(orderId: string, itemId: string, updateDto: UpdateOrderItemDto): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.article', 'items.period', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Find the specific order item by ID
    const itemToUpdate = order.items.find(item => item.id === itemId);
    if (!itemToUpdate) {
      throw new NotFoundException(`Order item with ID ${itemId} not found in order ${orderId}`);
    }

    if (!itemToUpdate.article) {
      throw new NotFoundException(`Article not found for order item ${itemId}`);
    }

    // Use transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Store old values for recalculation
      const oldTotalPrice = Number(itemToUpdate.totalPrice || 0);
      const oldPaidAmount = Number(itemToUpdate.paidAmount || 0);

      // Update quantity if provided
      if (updateDto.quantity !== undefined) {
        itemToUpdate.quantity = updateDto.quantity;
      }

      // Update selectedOptions if provided
      if (updateDto.selectedOptions !== undefined) {
        itemToUpdate.selectedOptions = updateDto.selectedOptions;
      }

      // Recalculate total price for this item
      const article = itemToUpdate.article;
      const quantity = Number(itemToUpdate.quantity);
      const basePrice = Number(article.pricePerUnit) * quantity;
      
      // Calculate customization price
      let customizationPrice = 0;
      if (itemToUpdate.selectedOptions && itemToUpdate.selectedOptions.length > 0) {
        for (const selectedOption of itemToUpdate.selectedOptions) {
          if (selectedOption.price && selectedOption.price > 0) {
            customizationPrice += selectedOption.price * quantity;
          }
        }
      }
      
      const newTotalPrice = Number((basePrice + customizationPrice).toFixed(2));
      itemToUpdate.totalPrice = newTotalPrice;

      // Adjust paid amount proportionally if total price changed
      let newPaidAmount = oldPaidAmount;
      if (oldTotalPrice > 0 && newTotalPrice !== oldTotalPrice) {
        // Maintain the same payment percentage
        const paymentPercentage = oldPaidAmount / oldTotalPrice;
        newPaidAmount = Number((newTotalPrice * paymentPercentage).toFixed(2));
        // Don't allow paid amount to exceed total price
        if (newPaidAmount > newTotalPrice) {
          newPaidAmount = newTotalPrice;
        }
        itemToUpdate.paidAmount = newPaidAmount;
      }

      // Save the updated item
      await queryRunner.manager.save(itemToUpdate);

      // Recalculate order totals
      const remainingItems = order.items;
      const newOrderTotalAmount = remainingItems.reduce((sum, item) => {
        const itemTotal = item.id === itemId ? newTotalPrice : Number(item.totalPrice || 0);
        return sum + itemTotal;
      }, 0);

      const newOrderPaidAmount = remainingItems.reduce((sum, item) => {
        const itemPaid = item.id === itemId ? newPaidAmount : Number(item.paidAmount || 0);
        return sum + itemPaid;
      }, 0);

      // Update order amounts
      order.totalAmount = Number(newOrderTotalAmount.toFixed(2));
      order.paidAmount = Number(newOrderPaidAmount.toFixed(2));
      
      // Recalculate payment status comparant amb el total amb IVA
      // Calcular el total amb IVA de tots els items de la comanda
      let totalAmountWithTax = 0;
      for (const item of remainingItems) {
        const itemSubtotal = item.id === itemId ? newTotalPrice : Number(item.totalPrice || 0);
        const taxRate = item.article?.taxRate ? Number(item.article.taxRate) : 0;
        const itemTax = itemSubtotal * (taxRate / 100);
        const itemTotalWithTax = itemSubtotal + itemTax;
        totalAmountWithTax += itemTotalWithTax;
      }
      const totalAmountWithTaxRounded = Number(totalAmountWithTax.toFixed(2));
      
      if (totalAmountWithTaxRounded === 0) {
        order.paymentStatus = PaymentStatus.UNPAID;
      } else if (newOrderPaidAmount === 0) {
        order.paymentStatus = PaymentStatus.UNPAID;
      } else if (newOrderPaidAmount >= totalAmountWithTaxRounded) {
        order.paymentStatus = PaymentStatus.PAID;
      } else {
        order.paymentStatus = PaymentStatus.PARTIAL;
      }
      
      // Save the order
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // Reload order with all relations to ensure we have fresh data
      const updatedOrder = await this.ordersRepository.findOne({
        where: { id: orderId },
        relations: ['items', 'items.article', 'items.period', 'user'],
      });

      if (!updatedOrder) {
        throw new NotFoundException('Order not found after update');
      }

      // Filter out items with null articleId (deleted items)
      const validItems = (updatedOrder.items || []).filter(item => item && item.articleId !== null && item.articleId !== undefined);

      const transportCost = await this.calculateTransportCostForOrder(updatedOrder);

      return new OrderResponseDto({
        ...updatedOrder,
        userName: updatedOrder.user ? `${updatedOrder.user.name} ${updatedOrder.user.surname}` : undefined,
        items: validItems.map(item => this.mapOrderItemToDto(item)),
        transportCost,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
      
      // Recalculate payment status comparant amb el total amb IVA
      // Calcular el total amb IVA de tots els items de la comanda
      let totalAmountWithTax = 0;
      for (const item of remainingItems) {
        const itemSubtotal = Number(item.totalPrice || 0);
        const taxRate = item.article?.taxRate ? Number(item.article.taxRate) : 0;
        const itemTax = itemSubtotal * (taxRate / 100);
        const itemTotalWithTax = itemSubtotal + itemTax;
        totalAmountWithTax += itemTotalWithTax;
      }
      const totalAmountWithTaxRounded = Number(totalAmountWithTax.toFixed(2));
      
      if (totalAmountWithTaxRounded === 0) {
        order.paymentStatus = PaymentStatus.UNPAID;
      } else if (newPaidAmount === 0) {
        order.paymentStatus = PaymentStatus.UNPAID;
      } else if (newPaidAmount >= totalAmountWithTaxRounded) {
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

      const transportCost = await this.calculateTransportCostForOrder(updatedOrder);

      return new OrderResponseDto({
        ...updatedOrder,
        userName: updatedOrder.user ? `${updatedOrder.user.name} ${updatedOrder.user.surname}` : undefined,
        items: validItems.map(item => this.mapOrderItemToDto(item)),
        transportCost,
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

  /**
   * Calcula el resum de pagaments per període, agrupant per usuari.
   * Retorna el subtotal de cada comanda, el transport repartit i el total per usuari.
   */
  async getPeriodPaymentSummary(periodId: string, groupId: string): Promise<PeriodPaymentSummaryDto> {
    // Obtenir informació del període
    const period = await this.periodsService.findOne(periodId, groupId);
    if (!period) {
      throw new NotFoundException(`Period with ID ${periodId} not found`);
    }

    // Obtenir totes les comandes del grup que tenen items d'aquest període
    const orders = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('items.period', 'period')
      .where('order.consumer_group_id = :groupId', { groupId })
      .andWhere('items.period_id = :periodId', { periodId })
      .getMany();

    // Filtrar comandes que tenen items vàlids d'aquest període
    const ordersWithPeriodItems = orders.filter(order => 
      order.items && order.items.some(item => 
        item.periodId === periodId && 
        item.articleId !== null && 
        item.articleId !== undefined
      )
    );

    // Agrupar per usuari
    const userMap = new Map<string, {
      userId: string;
      userName: string;
      orders: Order[];
      subtotal: number;
    }>();

    for (const order of ordersWithPeriodItems) {
      if (!order.user) continue;

      const userId = order.userId;
      const userName = `${order.user.name} ${order.user.surname}`;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName,
          orders: [],
          subtotal: 0,
        });
      }

      const userData = userMap.get(userId)!;
      userData.orders.push(order);
      
      // Sumar només el subtotal dels items d'aquest període
      const periodItemsSubtotal = order.items
        .filter(item => item.periodId === periodId && item.articleId !== null)
        .reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
      
      userData.subtotal += periodItemsSubtotal;
    }

    // Calcular el cost de transport repartit per usuari
    // El transport es reparteix entre tots els usuaris únics que tenen comandes en aquest període
    const uniqueUserIds = Array.from(userMap.keys());
    const transportCost = period.transportCost ? Number(period.transportCost) : 0;
    const transportCostPerUser = uniqueUserIds.length > 0 
      ? Number((transportCost / uniqueUserIds.length).toFixed(2))
      : 0;

    // Crear resum per usuari
    const userSummaries: UserPaymentSummaryDto[] = Array.from(userMap.values()).map(userData => {
      const total = Number((userData.subtotal + transportCostPerUser).toFixed(2));
      
      // Calcular quantitat pagada i estat de pagament basant-se només en els items d'aquest període
      let paidAmount = 0;
      let totalPeriodItemsAmount = 0;
      
      for (const order of userData.orders) {
        // Filtrar només els items d'aquest període
        const periodItems = order.items.filter(item => 
          item.periodId === periodId && 
          item.articleId !== null && 
          item.articleId !== undefined
        );
        
        // Sumar el paidAmount dels items d'aquest període
        for (const item of periodItems) {
          const itemSubtotal = Number(item.totalPrice || 0);
          const taxRate = item.article?.taxRate ? Number(item.article.taxRate) : 0;
          const itemTax = itemSubtotal * (taxRate / 100);
          const itemTotalWithTax = itemSubtotal + itemTax;
          
          paidAmount += Number(item.paidAmount || 0);
          totalPeriodItemsAmount += itemTotalWithTax;
        }
      }
      
      // Determinar estat de pagament basant-se en si tots els items del període estan pagats
      let paymentStatus: PaymentStatus;
      const roundedPaidAmount = Number(paidAmount.toFixed(2));
      const roundedTotalAmount = Number(totalPeriodItemsAmount.toFixed(2));
      
      if (roundedPaidAmount >= roundedTotalAmount && userData.orders.length > 0) {
        paymentStatus = PaymentStatus.PAID;
      } else if (roundedPaidAmount > 0) {
        paymentStatus = PaymentStatus.PARTIAL;
      } else {
        paymentStatus = PaymentStatus.UNPAID;
      }
      
      return new UserPaymentSummaryDto({
        userId: userData.userId,
        userName: userData.userName,
        subtotal: Number(userData.subtotal.toFixed(2)),
        transportCost: transportCostPerUser,
        total,
        ordersCount: userData.orders.length,
        paidAmount: Number(paidAmount.toFixed(2)),
        paymentStatus,
        orderIds: userData.orders.map(o => o.id),
      });
    });

    // Ordenar per nom d'usuari
    userSummaries.sort((a, b) => a.userName.localeCompare(b.userName));

    // Calcular totals generals
    const totalSubtotal = userSummaries.reduce((sum, u) => sum + u.subtotal, 0);
    const totalTransportCost = transportCost;
    const grandTotal = Number((totalSubtotal + totalTransportCost).toFixed(2));

    return new PeriodPaymentSummaryDto({
      periodId: period.id,
      periodName: period.name,
      users: userSummaries,
      totalSubtotal: Number(totalSubtotal.toFixed(2)),
      totalTransportCost: Number(totalTransportCost.toFixed(2)),
      grandTotal,
    });
  }

  /**
   * Marca totes les comandes d'un període i usuari com a pagades.
   * Només marca els items que pertanyen al període especificat.
   */
  async markPeriodOrdersAsPaid(periodId: string, userId: string, groupId: string): Promise<PeriodPaymentSummaryDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtenir totes les comandes del usuari al grup que tenen items d'aquest període
      // Primer obtenir les comandes que tenen items d'aquest període
      const ordersWithPeriodItems = await this.ordersRepository
        .createQueryBuilder('order')
        .leftJoin('order.items', 'items')
        .where('order.consumer_group_id = :groupId', { groupId })
        .andWhere('order.user_id = :userId', { userId })
        .andWhere('items.period_id = :periodId', { periodId })
        .select('DISTINCT order.id')
        .getRawMany();
      
      const orderIds = ordersWithPeriodItems.map(o => o.order_id);
      
      if (orderIds.length === 0) {
        await queryRunner.commitTransaction();
        return this.getPeriodPaymentSummary(periodId, groupId);
      }
      
      // Ara carregar les comandes completes amb TOTS els seus items (no només els del període)
      const orders = await this.ordersRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.article', 'article')
        .leftJoinAndSelect('items.period', 'period')
        .leftJoinAndSelect('order.user', 'user')
        .where('order.id IN (:...orderIds)', { orderIds })
        .getMany();

      // Filtrar comandes que tenen items vàlids d'aquest període
      const ordersToUpdate = orders.filter(order => 
        order.items && order.items.some(item => 
          item.periodId === periodId && 
          item.articleId !== null && 
          item.articleId !== undefined
        )
      );

      // Per cada comanda, marcar només els items del període com a pagats
      for (const order of ordersToUpdate) {
        const validItems = (order.items || []).filter(item => 
          item.periodId === periodId && 
          item.articleId !== null && 
          item.articleId !== undefined
        );

        let periodItemsPaidAmount = 0;
        let periodItemsTotalAmount = 0;

        for (const item of validItems) {
          const itemSubtotal = Number(item.totalPrice || 0);
          const taxRate = item.article?.taxRate ? Number(item.article.taxRate) : 0;
          const itemTax = itemSubtotal * (taxRate / 100);
          const itemTotalWithTax = itemSubtotal + itemTax;
          
          // Marcar item com a pagat
          item.paidAmount = Number(itemTotalWithTax.toFixed(2));
          periodItemsPaidAmount += itemTotalWithTax;
          periodItemsTotalAmount += itemSubtotal;
        }

        // Actualitzar paidAmount de la comanda (sumar el que ja estava pagat + el nou)
        const existingPaidAmount = Number(order.paidAmount || 0);
        // Calcular quant ja estava pagat dels items d'aquest període
        const existingPeriodPaid = validItems.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
        // Nou paidAmount = existingPaidAmount - existingPeriodPaid + periodItemsPaidAmount
        order.paidAmount = Number((existingPaidAmount - existingPeriodPaid + periodItemsPaidAmount).toFixed(2));

        // Recalcular el totalAmount de la comanda amb IVA inclòs per poder comparar correctament
        // Calcular el total amb IVA de tots els items de la comanda
        const allOrderItems = order.items || [];
        let totalAmountWithTax = 0;
        for (const item of allOrderItems) {
          const itemSubtotal = Number(item.totalPrice || 0);
          const taxRate = item.article?.taxRate ? Number(item.article.taxRate) : 0;
          const itemTax = itemSubtotal * (taxRate / 100);
          const itemTotalWithTax = itemSubtotal + itemTax;
          totalAmountWithTax += itemTotalWithTax;
        }
        const totalAmountWithTaxRounded = Number(totalAmountWithTax.toFixed(2));

        // Recalcular estat de pagament de la comanda comparant amb el total amb IVA
        if (order.paidAmount >= totalAmountWithTaxRounded) {
          order.paymentStatus = PaymentStatus.PAID;
        } else if (order.paidAmount > 0) {
          order.paymentStatus = PaymentStatus.PARTIAL;
        } else {
          order.paymentStatus = PaymentStatus.UNPAID;
        }

        // Actualitzar només el paidAmount dels items per evitar problemes amb les relacions
        for (const item of validItems) {
          await queryRunner.manager.update(
            OrderItem,
            { id: item.id },
            { paidAmount: item.paidAmount }
          );
        }
        // Actualitzar només els camps de l'order sense sincronitzar els items
        await queryRunner.manager.update(
          Order,
          { id: order.id },
          { 
            paidAmount: order.paidAmount,
            paymentStatus: order.paymentStatus
          }
        );
      }

      await queryRunner.commitTransaction();

      // Retornar el resum actualitzat
      return this.getPeriodPaymentSummary(periodId, groupId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Marca totes les comandes d'un període i usuari com a no pagades.
   * Només marca els items que pertanyen al període especificat.
   */
  async markPeriodOrdersAsUnpaid(periodId: string, userId: string, groupId: string): Promise<PeriodPaymentSummaryDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtenir totes les comandes del usuari al grup que tenen items d'aquest període
      // Primer obtenir les comandes que tenen items d'aquest període
      const ordersWithPeriodItems = await this.ordersRepository
        .createQueryBuilder('order')
        .leftJoin('order.items', 'items')
        .where('order.consumer_group_id = :groupId', { groupId })
        .andWhere('order.user_id = :userId', { userId })
        .andWhere('items.period_id = :periodId', { periodId })
        .select('DISTINCT order.id')
        .getRawMany();
      
      const orderIds = ordersWithPeriodItems.map(o => o.order_id);
      
      if (orderIds.length === 0) {
        await queryRunner.commitTransaction();
        return this.getPeriodPaymentSummary(periodId, groupId);
      }
      
      // Ara carregar les comandes completes amb TOTS els seus items (no només els del període)
      const orders = await this.ordersRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.article', 'article')
        .leftJoinAndSelect('items.period', 'period')
        .leftJoinAndSelect('order.user', 'user')
        .where('order.id IN (:...orderIds)', { orderIds })
        .getMany();

      // Filtrar comandes que tenen items vàlids d'aquest període
      const ordersToUpdate = orders.filter(order => 
        order.items && order.items.some(item => 
          item.periodId === periodId && 
          item.articleId !== null && 
          item.articleId !== undefined
        )
      );

      // Per cada comanda, marcar només els items del període com a no pagats
      for (const order of ordersToUpdate) {
        const validItems = (order.items || []).filter(item => 
          item.periodId === periodId && 
          item.articleId !== null && 
          item.articleId !== undefined
        );

        // Calcular quant estava pagat dels items d'aquest període
        const existingPeriodPaid = validItems.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);

        // Marcar tots els items del període com a no pagats
        for (const item of validItems) {
          item.paidAmount = 0;
        }

        // Actualitzar paidAmount de la comanda (restar el que estava pagat d'aquest període)
        const existingPaidAmount = Number(order.paidAmount || 0);
        order.paidAmount = Number(Math.max(0, existingPaidAmount - existingPeriodPaid).toFixed(2));

        // Recalcular el totalAmount de la comanda amb IVA inclòs per poder comparar correctament
        // Calcular el total amb IVA de tots els items de la comanda
        const allOrderItems = order.items || [];
        let totalAmountWithTax = 0;
        for (const item of allOrderItems) {
          const itemSubtotal = Number(item.totalPrice || 0);
          const taxRate = item.article?.taxRate ? Number(item.article.taxRate) : 0;
          const itemTax = itemSubtotal * (taxRate / 100);
          const itemTotalWithTax = itemSubtotal + itemTax;
          totalAmountWithTax += itemTotalWithTax;
        }
        const totalAmountWithTaxRounded = Number(totalAmountWithTax.toFixed(2));

        // Recalcular estat de pagament de la comanda comparant amb el total amb IVA
        if (order.paidAmount >= totalAmountWithTaxRounded) {
          order.paymentStatus = PaymentStatus.PAID;
        } else if (order.paidAmount > 0) {
          order.paymentStatus = PaymentStatus.PARTIAL;
        } else {
          order.paymentStatus = PaymentStatus.UNPAID;
        }

        // Actualitzar només el paidAmount dels items per evitar problemes amb les relacions
        for (const item of validItems) {
          await queryRunner.manager.update(
            OrderItem,
            { id: item.id },
            { paidAmount: item.paidAmount }
          );
        }
        // Actualitzar només els camps de l'order sense sincronitzar els items
        await queryRunner.manager.update(
          Order,
          { id: order.id },
          { 
            paidAmount: order.paidAmount,
            paymentStatus: order.paymentStatus
          }
        );
      }

      await queryRunner.commitTransaction();

      // Retornar el resum actualitzat
      return this.getPeriodPaymentSummary(periodId, groupId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
