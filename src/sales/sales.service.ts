import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, PaymentStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { SaleResponseDto, SaleItemResponseDto } from './dto/sale-response.dto';
import { ArticlesService } from '../articles/articles.service';
import { ConsumerGroupsService } from '../consumer-groups/consumer-groups.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemsRepository: Repository<SaleItem>,
    private readonly articlesService: ArticlesService,
    private readonly consumerGroupsService: ConsumerGroupsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(userEmail: string, createDto: CreateSaleDto): Promise<SaleResponseDto> {
    // Verify user is member of the group
    const isMember = await this.consumerGroupsService.isMember(userEmail, createDto.consumerGroupId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this consumer group');
    }

    if (!createDto.items || createDto.items.length === 0) {
      throw new BadRequestException('Sale must have at least one item');
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
          throw new BadRequestException(`Article ${article.name} is not in showcase`);
        }
      }

      // Create sale
      const sale = this.salesRepository.create({
        userEmail,
        consumerGroupId: createDto.consumerGroupId,
        totalAmount: 0,
        paidAmount: 0,
        paymentStatus: PaymentStatus.UNPAID,
      });

      const savedSale = await queryRunner.manager.save(sale);

      // Create sale items
      let totalAmount = 0;
      const saleItems: SaleItem[] = [];

      for (const itemDto of createDto.items) {
        const article = articles.find(a => a.id === itemDto.articleId);
        if (!article) {
          throw new NotFoundException(`Article ${itemDto.articleId} not found`);
        }

        const totalPrice = Number((Number(article.pricePerUnit) * itemDto.quantity).toFixed(2));
        totalAmount += totalPrice;

        const saleItem = this.saleItemsRepository.create({
          saleId: savedSale.id,
          articleId: article.id,
          articleName: article.name,
          quantity: itemDto.quantity,
          pricePerUnit: article.pricePerUnit,
          totalPrice,
          paidAmount: 0,
        });

        saleItems.push(saleItem);
      }

      await queryRunner.manager.save(saleItems);

      // Update total amount
      savedSale.totalAmount = totalAmount;
      await queryRunner.manager.save(savedSale);

      await queryRunner.commitTransaction();

      // Reload sale with items
      const completeSale = await this.salesRepository.findOne({
        where: { id: savedSale.id },
        relations: ['items'],
      });

      if (!completeSale) {
        throw new NotFoundException('Sale not found after creation');
      }

      return new SaleResponseDto({
        ...completeSale,
        items: completeSale.items.map(item => new SaleItemResponseDto(item)),
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findUserSales(userEmail: string, consumerGroupId?: string): Promise<SaleResponseDto[]> {
    const queryBuilder = this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .where('sale.user_email = :userEmail', { userEmail });

    if (consumerGroupId) {
      queryBuilder.andWhere('sale.consumer_group_id = :consumerGroupId', { consumerGroupId });
    }

    queryBuilder.orderBy('sale.created_at', 'DESC');

    const sales = await queryBuilder.getMany();

    return sales.map(sale => new SaleResponseDto({
      ...sale,
      items: sale.items.map(item => new SaleItemResponseDto(item)),
    }));
  }

  async findById(id: string): Promise<SaleResponseDto> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return new SaleResponseDto({
      ...sale,
      items: sale.items.map(item => new SaleItemResponseDto(item)),
    });
  }

  async findByGroup(groupId: string, paymentStatus?: PaymentStatus): Promise<SaleResponseDto[]> {
    const queryBuilder = this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .where('sale.consumer_group_id = :groupId', { groupId });

    if (paymentStatus) {
      queryBuilder.andWhere('sale.payment_status = :paymentStatus', { paymentStatus });
    }

    queryBuilder.orderBy('sale.created_at', 'DESC');

    const sales = await queryBuilder.getMany();

    return sales.map(sale => new SaleResponseDto({
      ...sale,
      items: sale.items.map(item => new SaleItemResponseDto(item)),
    }));
  }

  async registerPayment(saleId: string, paymentDto: RegisterPaymentDto): Promise<SaleResponseDto> {
    const sale = await this.salesRepository.findOne({
      where: { id: saleId },
      relations: ['items'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${saleId} not found`);
    }

    if (sale.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Sale is already fully paid');
    }

    // Use transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalPaidAmount = 0;

      for (const itemPayment of paymentDto.items) {
        const saleItem = sale.items.find(item => item.id === itemPayment.itemId);
        
        if (!saleItem) {
          throw new NotFoundException(`Sale item ${itemPayment.itemId} not found in this sale`);
        }

        const newPaidAmount = Number(saleItem.paidAmount) + itemPayment.amount;
        
        if (newPaidAmount > Number(saleItem.totalPrice)) {
          throw new BadRequestException(
            `Payment amount for item ${saleItem.articleName} exceeds total price. ` +
            `Total: ${saleItem.totalPrice}, Already paid: ${saleItem.paidAmount}, Trying to add: ${itemPayment.amount}`
          );
        }

        saleItem.paidAmount = newPaidAmount;
        await queryRunner.manager.save(saleItem);
        
        totalPaidAmount += newPaidAmount;
      }

      // Calculate total paid amount from all items
      const allItems = await queryRunner.manager.find(SaleItem, {
        where: { saleId: sale.id },
      });

      const totalPaid = allItems.reduce((sum, item) => sum + Number(item.paidAmount), 0);

      sale.paidAmount = totalPaid;

      // Update payment status
      if (totalPaid >= Number(sale.totalAmount)) {
        sale.paymentStatus = PaymentStatus.PAID;
      } else if (totalPaid > 0) {
        sale.paymentStatus = PaymentStatus.PARTIAL;
      } else {
        sale.paymentStatus = PaymentStatus.UNPAID;
      }

      await queryRunner.manager.save(sale);

      await queryRunner.commitTransaction();

      // Reload sale with items
      const updatedSale = await this.salesRepository.findOne({
        where: { id: saleId },
        relations: ['items'],
      });

      if (!updatedSale) {
        throw new NotFoundException('Sale not found after payment update');
      }

      return new SaleResponseDto({
        ...updatedSale,
        items: updatedSale.items.map(item => new SaleItemResponseDto(item)),
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async verifySaleAccess(saleId: string, userEmail: string, requireManager: boolean = false): Promise<Sale> {
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${saleId} not found`);
    }

    if (requireManager) {
      const isManager = await this.consumerGroupsService.isManager(userEmail, sale.consumerGroupId);
      if (!isManager) {
        throw new ForbiddenException('Only managers can perform this action');
      }
    } else {
      // User can access if they own the sale or are a manager
      const isOwner = sale.userEmail === userEmail;
      const isManager = await this.consumerGroupsService.isManager(userEmail, sale.consumerGroupId);
      
      if (!isOwner && !isManager) {
        throw new ForbiddenException('You do not have access to this sale');
      }
    }

    return sale;
  }
}

