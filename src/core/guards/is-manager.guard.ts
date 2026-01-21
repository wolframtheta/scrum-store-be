import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumerGroupsService } from '../../consumer-groups/consumer-groups.service';
import { ArticlesService } from '../../articles/articles.service';
import { Order } from '../../orders/entities/order.entity';

@Injectable()
export class IsManagerGuard implements CanActivate {
  private readonly logger = new Logger(IsManagerGuard.name);

  constructor(
    private readonly consumerGroupsService: ConsumerGroupsService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const routePath = request.route?.path || '';
    const isArticlesEndpoint = routePath.includes('/articles/');
    const isOrdersEndpoint = routePath.includes('/orders/');
    const isNormalizeEndpoint = routePath.includes('/normalize');
    
    // Handle case when body is an array (batch operations)
    let groupId = request.params.groupId || request.body?.consumerGroupId || request.body?.groupId;
    
    // If body is an array (like in batch operations), get consumerGroupId from first element
    if (!groupId && Array.isArray(request.body) && request.body.length > 0) {
      groupId = request.body[0]?.consumerGroupId || request.body[0]?.groupId;
      this.logger.debug(`IsManagerGuard - Got groupId from array body first element: ${groupId}`);
    }

    // Si estem en un endpoint batch amb articleIds, obtenir el groupId del primer article
    if (!groupId && isArticlesEndpoint && request.body?.articleIds && Array.isArray(request.body.articleIds) && request.body.articleIds.length > 0) {
      try {
        this.logger.debug(`IsManagerGuard - Attempting to get ArticlesService for batch operation with articleIds: ${JSON.stringify(request.body.articleIds)}`);
        const articlesService = this.moduleRef.get(ArticlesService, { strict: false });
        if (articlesService) {
          this.logger.debug(`IsManagerGuard - ArticlesService found, fetching article ${request.body.articleIds[0]}`);
          const article = await articlesService.findById(request.body.articleIds[0]);
          groupId = article.consumerGroupId;
          this.logger.debug(`IsManagerGuard - Got groupId from first article in batch: ${groupId}`);
        } else {
          this.logger.debug(`IsManagerGuard - ArticlesService not found`);
        }
      } catch (error) {
        this.logger.error(`IsManagerGuard - Could not get groupId from first article in batch: ${error.message}`, error.stack);
      }
    }

    // Si estem en un endpoint d'articles (PATCH /articles/:id o DELETE /articles/:id)
    // i no tenim groupId al body, intentar obtenir-lo de l'article
    if (!groupId && isArticlesEndpoint && request.params.id) {
      try {
        const articlesService = this.moduleRef.get(ArticlesService, { strict: false });
        if (articlesService) {
          const article = await articlesService.findById(request.params.id);
          groupId = article.consumerGroupId;
          this.logger.debug(`IsManagerGuard - Got groupId from article: ${groupId}`);
        }
      } catch (error) {
        this.logger.debug(`IsManagerGuard - Could not get groupId from article: ${error}`);
      }
    }

    // Si estem en un endpoint de comandes (PATCH /orders/:id/delivery)
    // i no tenim groupId, intentar obtenir-lo de la comanda
    if (!groupId && isOrdersEndpoint && request.params.id && routePath.includes('/delivery')) {
      try {
        const ordersRepository = this.moduleRef.get<Repository<Order>>(getRepositoryToken(Order), { strict: false });
        if (ordersRepository) {
          const order = await ordersRepository.findOne({
            where: { id: request.params.id },
            select: ['consumerGroupId'],
          });
          if (order) {
            groupId = order.consumerGroupId;
            this.logger.debug(`IsManagerGuard - Got groupId from order: ${groupId}`);
          }
        }
      } catch (error) {
        this.logger.debug(`IsManagerGuard - Could not get groupId from order: ${error}`);
      }
    }

    // Si encara no tenim groupId i NO estem en un endpoint d'articles ni de comandes, 
    // intentar de params.id (per endpoints com /consumer-groups/:id/...)
    if (!groupId && !isArticlesEndpoint && !isOrdersEndpoint) {
      groupId = request.params.id;
    }

    this.logger.debug(`IsManagerGuard - User: ${JSON.stringify(user)}`);
    this.logger.debug(`IsManagerGuard - Route path: ${routePath}`);
    this.logger.debug(`IsManagerGuard - Is articles endpoint: ${isArticlesEndpoint}`);
    this.logger.debug(`IsManagerGuard - Is normalize endpoint: ${isNormalizeEndpoint}`);
    this.logger.debug(`IsManagerGuard - Group ID from params.id: ${request.params.id}`);
    this.logger.debug(`IsManagerGuard - Group ID from params.groupId: ${request.params.groupId}`);
    this.logger.debug(`IsManagerGuard - Group ID from body.consumerGroupId: ${request.body?.consumerGroupId}`);
    this.logger.debug(`IsManagerGuard - Group ID from body.groupId: ${request.body?.groupId}`);
    this.logger.debug(`IsManagerGuard - Final Group ID: ${groupId}`);

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Para el endpoint de normalización, solo verificamos que el usuario sea manager de al menos un grupo
    if (isNormalizeEndpoint) {
      const managerGroups = await this.consumerGroupsService.findManagerGroups(user.email);
      if (managerGroups.length === 0) {
        throw new ForbiddenException('User must be a manager of at least one group to normalize articles');
      }
      this.logger.debug(`IsManagerGuard - User is manager of ${managerGroups.length} groups, allowing normalize`);
      return true;
    }

    if (!groupId) {
      throw new BadRequestException('Group ID not provided');
    }

    const isManager = await this.consumerGroupsService.isManager(user.email, groupId);
    this.logger.debug(`IsManagerGuard - isManager result: ${isManager}`);

    if (!isManager) {
      throw new ForbiddenException('User is not a manager of this group');
    }

    return true;
  }
}

