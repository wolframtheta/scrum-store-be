import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConsumerGroupsService } from '../../consumer-groups/consumer-groups.service';

@Injectable()
export class IsMemberGuard implements CanActivate {
  constructor(private readonly consumerGroupsService: ConsumerGroupsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    // Buscar groupId en diferents llocs: params.groupId, params.id, body.consumerGroupId, body.groupId
    const groupId = request.params.groupId || request.params.id || request.body?.consumerGroupId || request.body?.groupId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!groupId) {
      throw new BadRequestException('Group ID not provided');
    }

    const isMember = await this.consumerGroupsService.isMember(user.email, groupId);

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this group');
    }

    return true;
  }
}

