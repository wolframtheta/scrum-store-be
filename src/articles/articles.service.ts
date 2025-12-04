import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Article } from './entities/article.entity';
import { ArticlePriceHistory } from './entities/article-price-history.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { PriceHistoryResponseDto } from './dto/price-history-response.dto';
import { ConsumerGroupsService } from '../consumer-groups/consumer-groups.service';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
    @InjectRepository(ArticlePriceHistory)
    private readonly priceHistoryRepository: Repository<ArticlePriceHistory>,
    private readonly consumerGroupsService: ConsumerGroupsService,
  ) {}

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
        '(LOWER(article.name) LIKE LOWER(:search) OR LOWER(article.description) LIKE LOWER(:search) OR LOWER(producer.name) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('article.created_at', 'DESC');

    const articles = await queryBuilder.getMany();
    return articles.map(article => {
      const dto = new ArticleResponseDto(article);
      // Afegir noms del productor i proveidor
      (dto as any).producerName = article.producer?.name;
      (dto as any).supplierName = article.producer?.supplier?.name;
      return dto;
    });
  }

  async findById(id: string): Promise<ArticleResponseDto> {
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
    return dto;
  }

  async update(id: string, updateDto: UpdateArticleDto): Promise<ArticleResponseDto> {
    const article = await this.articlesRepository.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    const oldPrice = article.pricePerUnit;

    Object.assign(article, updateDto);
    const updatedArticle = await this.articlesRepository.save(article);

    // Save price history if price changed
    if (updateDto.pricePerUnit && updateDto.pricePerUnit !== oldPrice) {
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
}

