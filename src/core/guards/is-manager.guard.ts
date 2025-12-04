import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConsumerGroupsService } from '../../consumer-groups/consumer-groups.service';

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
    
    let groupId = request.params.groupId || request.body?.consumerGroupId || request.body?.groupId;

    // Si estem en un endpoint d'articles (PATCH /articles/:id o DELETE /articles/:id)
    // i no tenim groupId al body, intentar obtenir-lo de l'article
    if (!groupId && isArticlesEndpoint && request.params.id) {
      try {
        const articlesService = this.moduleRef.get('ArticlesService', { strict: false });
        if (articlesService) {
          const article = await articlesService.findById(request.params.id);
          groupId = article.consumerGroupId;
          this.logger.debug(`IsManagerGuard - Got groupId from article: ${groupId}`);
        }
      } catch (error) {
        this.logger.debug(`IsManagerGuard - Could not get groupId from article: ${error}`);
      }
    }

    // Si encara no tenim groupId i NO estem en un endpoint d'articles, 
    // intentar de params.id (per endpoints com /consumer-groups/:id/...)
    if (!groupId && !isArticlesEndpoint) {
      groupId = request.params.id;
    }

    this.logger.debug(`IsManagerGuard - User: ${JSON.stringify(user)}`);
    this.logger.debug(`IsManagerGuard - Route path: ${routePath}`);
    this.logger.debug(`IsManagerGuard - Is articles endpoint: ${isArticlesEndpoint}`);
    this.logger.debug(`IsManagerGuard - Group ID from params.id: ${request.params.id}`);
    this.logger.debug(`IsManagerGuard - Group ID from params.groupId: ${request.params.groupId}`);
    this.logger.debug(`IsManagerGuard - Group ID from body.consumerGroupId: ${request.body?.consumerGroupId}`);
    this.logger.debug(`IsManagerGuard - Group ID from body.groupId: ${request.body?.groupId}`);
    this.logger.debug(`IsManagerGuard - Final Group ID: ${groupId}`);

    if (!user) {
      throw new ForbiddenException('User not authenticated');
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

