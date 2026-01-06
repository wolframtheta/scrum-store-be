import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Article } from './entities/article.entity';
import { ArticlePriceHistory } from './entities/article-price-history.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { PriceHistoryResponseDto } from './dto/price-history-response.dto';
import { ConsumerGroupsService } from '../consumer-groups/consumer-groups.service';
import { PeriodsService } from '../periods/periods.service';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
    @InjectRepository(ArticlePriceHistory)
    private readonly priceHistoryRepository: Repository<ArticlePriceHistory>,
    private readonly consumerGroupsService: ConsumerGroupsService,
    @Inject(forwardRef(() => PeriodsService))
    private readonly periodsService: PeriodsService,
  ) {}

  /**
   * Busca un article existent basat en els criteris d'identificació únics
   * (category, product, variety, producerId, consumerGroupId, unitMeasure)
   */
  async findExistingArticle(createDto: CreateArticleDto): Promise<Article | null> {
    const where: any = {
      category: createDto.category,
      product: createDto.product,
      consumerGroupId: createDto.consumerGroupId,
      unitMeasure: createDto.unitMeasure,
    };

    // Handle nullable fields
    if (createDto.variety) {
      where.variety = createDto.variety;
    } else {
      where.variety = IsNull();
    }

    if (createDto.producerId) {
      where.producerId = createDto.producerId;
    } else {
      where.producerId = IsNull();
    }

    return await this.articlesRepository.findOne({
      where,
      relations: ['producer', 'producer.supplier'],
    });
  }

  /**
   * Busca un article existent o el crea si no existeix
   */
  async findOrCreateArticle(createDto: CreateArticleDto): Promise<ArticleResponseDto> {
    // Buscar article existent
    const existingArticle = await this.findExistingArticle(createDto);

    if (existingArticle) {
      // Actualitzar el preu base si és diferent (opcional, per mantenir el preu més recent)
      if (createDto.pricePerUnit !== existingArticle.pricePerUnit) {
        existingArticle.pricePerUnit = createDto.pricePerUnit;
        await this.articlesRepository.save(existingArticle);
        await this.savePriceHistory(existingArticle.id, createDto.pricePerUnit);
      }

      const dto = new ArticleResponseDto(existingArticle);
      (dto as any).producerName = existingArticle.producer?.name;
      (dto as any).supplierName = existingArticle.producer?.supplier?.name;
      return dto;
    }

    // Si no existeix, crear-lo
    return await this.create(createDto);
  }

  async create(createDto: CreateArticleDto): Promise<ArticleResponseDto> {
    const article = this.articlesRepository.create(createDto);
    const savedArticle = await this.articlesRepository.save(article);

    // Save initial price in history
    await this.savePriceHistory(savedArticle.id, savedArticle.pricePerUnit);

    // Recarregar amb relacions per obtenir noms del productor i proveidor
    const articleWithRelations = await this.articlesRepository.findOne({
      where: { id: savedArticle.id },
      relations: ['producer', 'producer.supplier'],
    });

    const dto = new ArticleResponseDto(articleWithRelations || savedArticle);
    // Afegir noms del productor i proveidor
    if (articleWithRelations) {
      (dto as any).producerName = articleWithRelations.producer?.name;
      (dto as any).supplierName = articleWithRelations.producer?.supplier?.name;
    }
    return dto;
  }

  async createBatch(createDtos: CreateArticleDto[]): Promise<{ created: number; failed: number; articles: ArticleResponseDto[] }> {
    const results: ArticleResponseDto[] = [];
    let created = 0;
    let failed = 0;

    for (const createDto of createDtos) {
      try {
        const article = await this.findOrCreateArticle(createDto);
        results.push(article);
        // Si l'article ja existia, no incrementem created
        const existing = await this.findExistingArticle(createDto);
        if (!existing) {
          created++;
        }
      } catch (error) {
        console.error('Error creating article:', error);
        failed++;
      }
    }

    return {
      created,
      failed,
      articles: results,
    };
  }

  async findAll(
    groupId?: string,
    inShowcase?: boolean,
    search?: string,
  ): Promise<ArticleResponseDto[]> {
    const queryBuilder = this.articlesRepository.createQueryBuilder('article')
      .leftJoinAndSelect('article.producer', 'producer')
      .leftJoinAndSelect('producer.supplier', 'supplier');

    if (groupId) {
      queryBuilder.andWhere('article.consumer_group_id = :groupId', { groupId });
    }

    if (inShowcase !== undefined) {
      queryBuilder.andWhere('article.in_showcase = :inShowcase', { inShowcase });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(article.category) LIKE LOWER(:search) OR LOWER(article.product) LIKE LOWER(:search) OR LOWER(article.variety) LIKE LOWER(:search) OR LOWER(article.description) LIKE LOWER(:search) OR LOWER(producer.name) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('article.created_at', 'DESC');

    const articles = await queryBuilder.getMany();
    
    // Obtener precios del período actual si hay groupId
    let currentPeriodPrices: Map<string, number> = new Map();
    if (groupId) {
      try {
        const articleIds = articles.map(a => a.id);
        currentPeriodPrices = await this.periodsService.getCurrentPeriodPrices(articleIds, groupId);
      } catch (error) {
        console.error('Error getting current period prices:', error);
      }
    }

    return articles.map(article => {
      const dto = new ArticleResponseDto(article);
      // Afegir noms del productor i proveidor
      (dto as any).producerName = article.producer?.name;
      (dto as any).supplierName = article.producer?.supplier?.name;
      // Afegir preu del període actual si existeix
      const currentPrice = currentPeriodPrices.get(article.id);
      if (currentPrice !== undefined) {
        (dto as any).currentPeriodPrice = currentPrice;
      }
      return dto;
    });
  }

  async findById(id: string, consumerGroupId?: string): Promise<ArticleResponseDto> {
    const article = await this.articlesRepository.findOne({
      where: { id },
      relations: ['producer', 'producer.supplier'],
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    const dto = new ArticleResponseDto(article);
    // Afegir noms del productor i proveidor
    (dto as any).producerName = article.producer?.name;
    (dto as any).supplierName = article.producer?.supplier?.name;
    
    // Afegir preu del període actual si hi ha consumerGroupId
    if (consumerGroupId) {
      try {
        const currentPrice = await this.periodsService.getCurrentPeriodPrice(id, consumerGroupId);
        if (currentPrice !== null) {
          (dto as any).currentPeriodPrice = currentPrice;
        }
      } catch (error) {
        console.error('Error getting current period price:', error);
      }
    }
    
    return dto;
  }

  async update(id: string, updateDto: UpdateArticleDto, consumerGroupId?: string): Promise<ArticleResponseDto> {
    const article = await this.articlesRepository.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    const oldPrice = article.pricePerUnit;
    const priceChanged = updateDto.pricePerUnit !== undefined && updateDto.pricePerUnit !== oldPrice;

    // Si s'ha canviat el preu i hi ha un consumerGroupId, actualitzar el preu del període actual
    if (priceChanged && consumerGroupId && updateDto.pricePerUnit !== undefined) {
      try {
        const currentPeriod = await this.periodsService.getCurrentPeriod(consumerGroupId);
        if (currentPeriod) {
          // Actualitzar el preu del període actual (o afegir-lo si no existeix)
          await this.periodsService.updateArticlePrice(
            currentPeriod.id,
            consumerGroupId,
            id,
            updateDto.pricePerUnit
          );
        }
      } catch (error: any) {
        // Si l'article no està al període, intentar afegir-lo
        if (error?.status === 404 || error?.message?.includes('no está asociado')) {
          try {
            const currentPeriod = await this.periodsService.getCurrentPeriod(consumerGroupId);
            if (currentPeriod) {
              await this.periodsService.addArticle(
                currentPeriod.id,
                consumerGroupId,
                id,
                updateDto.pricePerUnit
              );
            }
          } catch (addError) {
            console.error('Error adding article to current period:', addError);
          }
        } else {
          console.error('Error updating current period price:', error);
        }
        // Continuar amb l'actualització de l'article encara que falli l'actualització del període
      }
    }

    // Actualitzar l'article (incloent el preu base per mantenir-lo sincronitzat)
    Object.assign(article, updateDto);
    const updatedArticle = await this.articlesRepository.save(article);

    // Save price history if price changed
    if (priceChanged) {
      await this.savePriceHistory(updatedArticle.id, updatedArticle.pricePerUnit);
    }

    return new ArticleResponseDto(updatedArticle);
  }

  async delete(id: string): Promise<void> {
    const article = await this.articlesRepository.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    await this.articlesRepository.remove(article);
  }

  async toggleShowcase(id: string, inShowcase: boolean): Promise<ArticleResponseDto> {
    const article = await this.articlesRepository.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    article.inShowcase = inShowcase;
    const updatedArticle = await this.articlesRepository.save(article);

    return new ArticleResponseDto(updatedArticle);
  }

  async getPriceHistory(id: string): Promise<PriceHistoryResponseDto[]> {
    const article = await this.articlesRepository.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    const history = await this.priceHistoryRepository.find({
      where: { articleId: id },
      order: { changedAt: 'DESC' },
    });

    return history.map(h => new PriceHistoryResponseDto(h));
  }

  async updateImage(id: string, imageUrl: string): Promise<ArticleResponseDto> {
    const article = await this.articlesRepository.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    article.image = imageUrl;
    const updatedArticle = await this.articlesRepository.save(article);

    return new ArticleResponseDto(updatedArticle);
  }

  async deleteImage(id: string): Promise<ArticleResponseDto> {
    const article = await this.articlesRepository.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    article.image = undefined;
    const updatedArticle = await this.articlesRepository.save(article);

    return new ArticleResponseDto(updatedArticle);
  }

  private async savePriceHistory(articleId: string, pricePerUnit: number): Promise<void> {
    const priceHistory = this.priceHistoryRepository.create({
      articleId,
      pricePerUnit,
    });

    await this.priceHistoryRepository.save(priceHistory);
  }

  async verifyArticleOwnership(articleId: string, userEmail: string): Promise<boolean> {
    const article = await this.articlesRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      return false;
    }

    return this.consumerGroupsService.isManager(userEmail, article.consumerGroupId);
  }

  async verifyUserIsManager(consumerGroupId: string, userEmail: string): Promise<boolean> {
    return this.consumerGroupsService.isManager(userEmail, consumerGroupId);
  }

  async batchDelete(articleIds: string[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const id of articleIds) {
      try {
        await this.delete(id);
        deleted++;
      } catch (error) {
        console.error(`Error deleting article ${id}:`, error);
        failed++;
      }
    }

    return { deleted, failed };
  }

  async batchToggleShowcase(articleIds: string[], inShowcase: boolean): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const id of articleIds) {
      try {
        await this.toggleShowcase(id, inShowcase);
        updated++;
      } catch (error) {
        console.error(`Error toggling showcase for article ${id}:`, error);
        failed++;
      }
    }

    return { updated, failed };
  }

  async batchToggleSeasonal(articleIds: string[], isSeasonal: boolean): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const id of articleIds) {
      try {
        const article = await this.articlesRepository.findOne({ where: { id } });
        if (!article) {
          failed++;
          continue;
        }
        article.isSeasonal = isSeasonal;
        await this.articlesRepository.save(article);
        updated++;
      } catch (error) {
        console.error(`Error toggling seasonal for article ${id}:`, error);
        failed++;
      }
    }

    return { updated, failed };
  }

  async batchToggleEco(articleIds: string[], isEco: boolean): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const id of articleIds) {
      try {
        const article = await this.articlesRepository.findOne({ where: { id } });
        if (!article) {
          failed++;
          continue;
        }
        article.isEco = isEco;
        await this.articlesRepository.save(article);
        updated++;
      } catch (error) {
        console.error(`Error toggling eco for article ${id}:`, error);
        failed++;
      }
    }

    return { updated, failed };
  }
}

