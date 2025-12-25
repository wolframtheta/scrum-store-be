import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumerGroupsService } from './consumer-groups.service';
import { ConsumerGroupsController } from './consumer-groups.controller';
import { ConsumerGroupsAdminController } from './consumer-groups-admin.controller';
import { ConsumerGroupsPeriodsController } from './consumer-groups-periods.controller';
import { ConsumerGroupsOrdersController } from './consumer-groups-orders.controller';
import { ConsumerGroup } from './entities/consumer-group.entity';
import { UserConsumerGroup } from './entities/user-consumer-group.entity';
import { GroupInvitation } from './entities/group-invitation.entity';
import { User } from '../users/entities/user.entity';
import { StorageModule } from '../storage/storage.module';
import { PeriodsModule } from '../periods/periods.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsumerGroup, UserConsumerGroup, GroupInvitation, User]),
    StorageModule,
    PeriodsModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [
    ConsumerGroupsController,
    ConsumerGroupsAdminController,
    ConsumerGroupsPeriodsController,
    ConsumerGroupsOrdersController,
  ],
  providers: [ConsumerGroupsService],
  exports: [ConsumerGroupsService],
})
export class ConsumerGroupsModule {}

