import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Period, PeriodRecurrence } from './entities/period.entity';
import { PeriodArticle } from './entities/period-article.entity';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { PeriodResponseDto } from './dto/period-response.dto';
import { ShowcasePeriodDto, ShowcaseArticleItemDto } from './dto/showcase-response.dto';
import { SuppliersService } from '../suppliers/suppliers.service';

@Injectable()
export class PeriodsService {
  constructor(
    @InjectRepository(Period)
    private readonly periodsRepository: Repository<Period>,
    @InjectRepository(PeriodArticle)
    private readonly periodArticlesRepository: Repository<PeriodArticle>,
    private readonly suppliersService: SuppliersService,
  ) {}

  async create(createPeriodDto: CreatePeriodDto, consumerGroupId: string): Promise<PeriodResponseDto> {
    // Verificar que el proveedor existe y pertenece al consumer group
    await this.suppliersService.findOne(createPeriodDto.supplierId, consumerGroupId);

    // Validar fechas
    const startDate = new Date(createPeriodDto.startDate);
    const endDate = new Date(createPeriodDto.endDate);
    const deliveryDate = new Date(createPeriodDto.deliveryDate);

    if (endDate < startDate) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    if (deliveryDate < startDate) {
      throw new BadRequestException('La fecha de entrega debe ser posterior a la fecha de inicio');
    }

    // Crear el período
    const period = this.periodsRepository.create({
      name: createPeriodDto.name,
      supplierId: createPeriodDto.supplierId,
      startDate,
      endDate,
      deliveryDate,
      recurrence: createPeriodDto.recurrence || PeriodRecurrence.CUSTOM,
      transportCost: createPeriodDto.transportCost ?? undefined,
    });

    const savedPeriod = await this.periodsRepository.save(period);

    // Crear los artículos del período si se proporcionan
    if (createPeriodDto.articles && createPeriodDto.articles.length > 0) {
      const periodArticles = createPeriodDto.articles.map(article => 
        this.periodArticlesRepository.create({
          periodId: savedPeriod.id,
          articleId: article.articleId,
          pricePerUnit: article.pricePerUnit,
        })
      );
      await this.periodArticlesRepository.save(periodArticles);
    }

    return this.findOne(savedPeriod.id, consumerGroupId);
  }

  async findAll(consumerGroupId: string, supplierId?: string): Promise<PeriodResponseDto[]> {
    // Si hi ha supplierId, verificar que el proveedor existe y pertenece al consumer group
    if (supplierId) {
      await this.suppliersService.findOne(supplierId, consumerGroupId);
    }

    // Obtenir tots els proveïdors del consumer group
    const suppliers = await this.suppliersService.findAll(consumerGroupId, false);
    const supplierIds = suppliers.map(s => s.id);

    const where: any = supplierId ? { supplierId } : { supplierId: In(supplierIds) };

    const periods = await this.periodsRepository.find({
      where,
      relations: ['supplier', 'periodArticles', 'periodArticles.article'],
      order: { startDate: 'DESC' },
    });

    return periods.map(period => new PeriodResponseDto(period));
  }

  async findOne(id: string, consumerGroupId: string): Promise<PeriodResponseDto> {
    const period = await this.periodsRepository.findOne({
      where: { id },
      relations: ['supplier', 'periodArticles', 'periodArticles.article'],
    });

    if (!period) {
      throw new NotFoundException(`Period with ID ${id} not found`);
    }

    // Verificar que el proveedor pertenece al consumer group
    await this.suppliersService.findOne(period.supplierId, consumerGroupId);

    return new PeriodResponseDto(period);
  }

  async update(id: string, consumerGroupId: string, updatePeriodDto: UpdatePeriodDto): Promise<PeriodResponseDto> {
    const period = await this.findOne(id, consumerGroupId);
    const periodEntity = await this.periodsRepository.findOne({ where: { id } });

    if (!periodEntity) {
      throw new NotFoundException(`Period with ID ${id} not found`);
    }

    // Validar fechas si se proporcionan
    if (updatePeriodDto.startDate || updatePeriodDto.endDate) {
      const startDate = updatePeriodDto.startDate ? new Date(updatePeriodDto.startDate) : periodEntity.startDate;
      const endDate = updatePeriodDto.endDate ? new Date(updatePeriodDto.endDate) : periodEntity.endDate;

      if (endDate < startDate) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }

    if (updatePeriodDto.deliveryDate) {
      const deliveryDate = new Date(updatePeriodDto.deliveryDate);
      const startDate = updatePeriodDto.startDate ? new Date(updatePeriodDto.startDate) : periodEntity.startDate;

      if (deliveryDate < startDate) {
        throw new BadRequestException('La fecha de entrega debe ser posterior a la fecha de inicio');
      }
    }

    // Si se cambia el proveedor, verificar que existe
    if (updatePeriodDto.supplierId) {
      await this.suppliersService.findOne(updatePeriodDto.supplierId, consumerGroupId);
    }

    // Actualizar el período
    Object.assign(periodEntity, {
      name: updatePeriodDto.name ?? periodEntity.name,
      supplierId: updatePeriodDto.supplierId ?? periodEntity.supplierId,
      startDate: updatePeriodDto.startDate ? new Date(updatePeriodDto.startDate) : periodEntity.startDate,
      endDate: updatePeriodDto.endDate ? new Date(updatePeriodDto.endDate) : periodEntity.endDate,
      deliveryDate: updatePeriodDto.deliveryDate ? new Date(updatePeriodDto.deliveryDate) : periodEntity.deliveryDate,
      recurrence: updatePeriodDto.recurrence ?? periodEntity.recurrence,
      transportCost: updatePeriodDto.transportCost !== undefined 
        ? (updatePeriodDto.transportCost === null ? undefined : updatePeriodDto.transportCost)
        : periodEntity.transportCost,
    });

    await this.periodsRepository.save(periodEntity);

    // Actualizar artículos si se proporcionan
    if (updatePeriodDto.articles !== undefined) {
      // Eliminar artículos existentes
      await this.periodArticlesRepository.delete({ periodId: id });

      // Crear nuevos artículos
      if (updatePeriodDto.articles.length > 0) {
        const periodArticles = updatePeriodDto.articles.map(article =>
          this.periodArticlesRepository.create({
            periodId: id,
            articleId: article.articleId,
            pricePerUnit: article.pricePerUnit,
          })
        );
        await this.periodArticlesRepository.save(periodArticles);
      }
    }

    return this.findOne(id, consumerGroupId);
  }

  async remove(id: string, consumerGroupId: string): Promise<void> {
    await this.findOne(id, consumerGroupId);
    await this.periodsRepository.delete(id);
  }

  async addArticle(periodId: string, consumerGroupId: string, articleId: string, pricePerUnit: number): Promise<PeriodResponseDto> {
    const period = await this.findOne(periodId, consumerGroupId);

    // Verificar que el artículo no esté ya asociado
    const existing = await this.periodArticlesRepository.findOne({
      where: { periodId, articleId },
    });

    if (existing) {
      throw new BadRequestException('El artículo ya está asociado a este período');
    }

    const periodArticle = this.periodArticlesRepository.create({
      periodId,
      articleId,
      pricePerUnit,
    });

    await this.periodArticlesRepository.save(periodArticle);

    return this.findOne(periodId, consumerGroupId);
  }

  async addArticlesBatch(
    periodId: string,
    consumerGroupId: string,
    articles: Array<{ articleId: string; pricePerUnit: number }>,
  ): Promise<{ added: number; failed: number; errors: Array<{ articleId: string; error: string }> }> {
    await this.findOne(periodId, consumerGroupId);

    // Get existing article IDs for this period to avoid duplicates
    const existingArticles = await this.periodArticlesRepository.find({
      where: { periodId },
      select: ['articleId'],
    });
    const existingArticleIds = new Set(existingArticles.map(pa => pa.articleId));

    const periodArticles: PeriodArticle[] = [];
    const errors: Array<{ articleId: string; error: string }> = [];
    let added = 0;
    let failed = 0;

    for (const article of articles) {
      // Skip if already exists
      if (existingArticleIds.has(article.articleId)) {
        errors.push({
          articleId: article.articleId,
          error: 'El artículo ya está asociado a este período',
        });
        failed++;
        continue;
      }

      try {
        const periodArticle = this.periodArticlesRepository.create({
          periodId,
          articleId: article.articleId,
          pricePerUnit: article.pricePerUnit,
        });
        periodArticles.push(periodArticle);
        existingArticleIds.add(article.articleId); // Mark as added to avoid duplicates in the same batch
        added++;
      } catch (error) {
        errors.push({
          articleId: article.articleId,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
        failed++;
      }
    }

    // Save all articles in batch
    if (periodArticles.length > 0) {
      await this.periodArticlesRepository.save(periodArticles);
    }

    return { added, failed, errors };
  }

  async updateArticlePrice(periodId: string, consumerGroupId: string, articleId: string, pricePerUnit: number): Promise<PeriodResponseDto> {
    await this.findOne(periodId, consumerGroupId);

    const periodArticle = await this.periodArticlesRepository.findOne({
      where: { periodId, articleId },
    });

    if (!periodArticle) {
      throw new NotFoundException('El artículo no está asociado a este período');
    }

    periodArticle.pricePerUnit = pricePerUnit;
    await this.periodArticlesRepository.save(periodArticle);

    return this.findOne(periodId, consumerGroupId);
  }

  async removeArticle(periodId: string, consumerGroupId: string, articleId: string): Promise<PeriodResponseDto> {
    await this.findOne(periodId, consumerGroupId);

    await this.periodArticlesRepository.delete({ periodId, articleId });

    return this.findOne(periodId, consumerGroupId);
  }

  /**
   * Obtener períodos abiertos para el showcase
   * Un período está "abierto" si la fecha actual está entre startDate y endDate
   */
  async getShowcasePeriods(consumerGroupId: string): Promise<ShowcasePeriodDto[]> {
    // Obtener todos los proveedores del consumer group
    const suppliers = await this.suppliersService.findAll(consumerGroupId, false);
    const supplierIds = suppliers.map(s => s.id);

    if (supplierIds.length === 0) {
      console.log(`[Showcase] No suppliers found for consumer group ${consumerGroupId}`);
      return [];
    }

    const now = new Date();
    // Crear fecha de hoy en formato YYYY-MM-DD para comparar correctamente con campos DATE de PostgreSQL
    // PostgreSQL DATE se compara como string YYYY-MM-DD
    const todayStr = now.toISOString().split('T')[0]; // "2025-12-25"
    // Crear Date object en UTC para la comparación
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');

    console.log(`[Showcase] Looking for periods with endDate >= ${todayStr}`);
    console.log(`[Showcase] Current date: ${now.toISOString()}, today string: ${todayStr}`);
    console.log(`[Showcase] Supplier IDs: ${supplierIds.join(', ')}`);

    // Obtener todos los períodos primero para debugging
    const allPeriods = await this.periodsRepository.find({
      where: {
        supplierId: In(supplierIds),
      },
      relations: ['supplier', 'periodArticles', 'periodArticles.article', 'periodArticles.article.producer', 'periodArticles.article.producer.supplier'],
      order: { startDate: 'ASC' },
    });

    console.log(`[Showcase] Total periods found (without date filter): ${allPeriods.length}`);
    allPeriods.forEach(p => {
      const endDateStr = p.endDate instanceof Date 
        ? p.endDate.toISOString().split('T')[0]
        : String(p.endDate).split('T')[0];
      const startDateStr = p.startDate instanceof Date
        ? p.startDate.toISOString().split('T')[0]
        : String(p.startDate).split('T')[0];
      console.log(`[Showcase]   - Period "${p.name}": startDate=${startDateStr}, endDate=${endDateStr}, articles=${p.periodArticles?.length || 0}`);
    });

    // Obtener períodos que puedan estar abiertos (endDate >= today)
    // Usar Raw query para comparar correctamente con campos DATE de PostgreSQL
    const periods = await this.periodsRepository
      .createQueryBuilder('period')
      .where('period.supplier_id IN (:...supplierIds)', { supplierIds })
      .andWhere('period.end_date >= :today', { today: todayStr })
      .leftJoinAndSelect('period.supplier', 'supplier')
      .leftJoinAndSelect('period.periodArticles', 'periodArticles')
      .leftJoinAndSelect('periodArticles.article', 'article')
      .leftJoinAndSelect('article.producer', 'producer')
      .leftJoinAndSelect('producer.supplier', 'producerSupplier')
      .orderBy('period.start_date', 'ASC')
      .getMany();

    console.log(`[Showcase] Found ${periods.length} periods with endDate >= ${todayStr}`);

    // Filtrar períodos abiertos y mapear a ShowcasePeriodDto
    const showcasePeriods: ShowcasePeriodDto[] = [];

    for (const period of periods) {
      // Las fechas de la BD son de tipo 'date', así que solo tienen día/mes/año
      // Convertir a string YYYY-MM-DD para comparar
      const startDateStr = period.startDate instanceof Date 
        ? period.startDate.toISOString().split('T')[0]
        : String(period.startDate).split('T')[0];
      const endDateStr = period.endDate instanceof Date
        ? period.endDate.toISOString().split('T')[0]
        : String(period.endDate).split('T')[0];

      // Determinar el estado del período comparando strings YYYY-MM-DD
      // Un período está abierto si: todayStr >= startDateStr && todayStr <= endDateStr
      let status: 'open' | 'closed' | 'processing' | 'delivered';
      if (todayStr < startDateStr) {
        status = 'closed';
      } else if (todayStr > endDateStr) {
        status = 'closed';
      } else {
        status = 'open';
      }

      console.log(`[Showcase] Period ${period.name}: startDate=${startDateStr}, endDate=${endDateStr}, today=${todayStr}, status=${status}, articles=${period.periodArticles?.length || 0}`);

      // Solo incluir períodos abiertos
      if (status !== 'open') {
        continue;
      }

      // Filtrar artículos que tengan el artículo cargado i estiguin marcats per l'aparador
      const validPeriodArticles = (period.periodArticles || []).filter(pa => pa.article && pa.article.inShowcase === true);

      if (validPeriodArticles.length === 0) {
        console.log(`[Showcase] Period ${period.name} has no valid showcase articles, skipping`);
        continue;
      }

      // Mapear artículos
      const articles: ShowcaseArticleItemDto[] = validPeriodArticles.map(pa => ({
        id: pa.id,
        articleId: pa.articleId,
        product: pa.article!.product || '',
        variety: pa.article!.variety,
        category: pa.article!.category,
        pricePerUnit: Number(pa.pricePerUnit),
        unitMeasure: pa.article!.unitMeasure || 'unit',
        image: pa.article!.image,
        producerName: pa.article!.producer?.name,
        supplierName: pa.article!.producer?.supplier?.name,
        isAvailable: true, // Por defecto disponible
        isEco: pa.article!.isEco || false,
        isSeasonal: pa.article!.isSeasonal || false,
        description: pa.article!.description,
        city: pa.article!.city,
        taxRate: pa.article!.taxRate || 0,
        customizationOptions: pa.article!.customizationOptions,
      }));

      showcasePeriods.push({
        periodId: period.id,
        periodName: period.name,
        deliveryDate: period.deliveryDate,
        startDate: period.startDate,
        endDate: period.endDate,
        status,
        articles,
      });
    }

    console.log(`[Showcase] Returning ${showcasePeriods.length} open periods with ${showcasePeriods.reduce((sum, p) => sum + p.articles.length, 0)} total articles`);

    return showcasePeriods;
  }

  /**
   * Obtener el período actual (abierto) para un consumer group
   * Un período está abierto si la fecha actual está entre startDate y endDate
   */
  async getCurrentPeriod(consumerGroupId: string, supplierId?: string): Promise<Period | null> {
    const suppliers = await this.suppliersService.findAll(consumerGroupId, false);
    const supplierIds = supplierId ? [supplierId] : suppliers.map(s => s.id);

    if (supplierIds.length === 0) {
      return null;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Buscar períodos abiertos
    const periods = await this.periodsRepository
      .createQueryBuilder('period')
      .where('period.supplier_id IN (:...supplierIds)', { supplierIds })
      .andWhere('period.start_date <= :today', { today: todayStr })
      .andWhere('period.end_date >= :today', { today: todayStr })
      .orderBy('period.start_date', 'DESC')
      .getMany();

    // Retornar el más reciente si hay varios
    return periods.length > 0 ? periods[0] : null;
  }

  /**
   * Obtener el precio de un artículo en el período actual
   */
  async getCurrentPeriodPrice(articleId: string, consumerGroupId: string): Promise<number | null> {
    const currentPeriod = await this.getCurrentPeriod(consumerGroupId);
    
    if (!currentPeriod) {
      return null;
    }

    const periodArticle = await this.periodArticlesRepository.findOne({
      where: {
        periodId: currentPeriod.id,
        articleId,
      },
    });

    return periodArticle ? Number(periodArticle.pricePerUnit) : null;
  }

  /**
   * Obtener precios del período actual para múltiples artículos
   */
  async getCurrentPeriodPrices(articleIds: string[], consumerGroupId: string): Promise<Map<string, number>> {
    const currentPeriod = await this.getCurrentPeriod(consumerGroupId);
    const pricesMap = new Map<string, number>();

    if (!currentPeriod || articleIds.length === 0) {
      return pricesMap;
    }

    const periodArticles = await this.periodArticlesRepository.find({
      where: {
        periodId: currentPeriod.id,
        articleId: In(articleIds),
      },
    });

    periodArticles.forEach(pa => {
      pricesMap.set(pa.articleId, Number(pa.pricePerUnit));
    });

    return pricesMap;
  }
}

