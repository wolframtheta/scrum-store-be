import { Module } from '@nestjs/common';
import { IsManagerGuard } from './guards/is-manager.guard';
import { IsMemberGuard } from './guards/is-member.guard';
import { RolesGuard } from './guards/roles.guard';
import { ConsumerGroupsModule } from '../consumer-groups/consumer-groups.module';

@Module({
  imports: [ConsumerGroupsModule],
  providers: [IsManagerGuard, IsMemberGuard, RolesGuard],
  exports: [IsManagerGuard, IsMemberGuard, RolesGuard],
})
export class CoreModule {}

