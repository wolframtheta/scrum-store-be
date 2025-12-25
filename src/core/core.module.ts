import { Module, forwardRef } from '@nestjs/common';
import { IsManagerGuard } from './guards/is-manager.guard';
import { IsMemberGuard } from './guards/is-member.guard';
import { RolesGuard } from './guards/roles.guard';
import { ConsumerGroupsModule } from '../consumer-groups/consumer-groups.module';
import { ArticlesModule } from '../articles/articles.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [ConsumerGroupsModule, forwardRef(() => ArticlesModule), forwardRef(() => OrdersModule)],
  providers: [IsManagerGuard, IsMemberGuard, RolesGuard],
  exports: [IsManagerGuard, IsMemberGuard, RolesGuard],
})
export class CoreModule {}

