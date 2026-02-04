import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumerGroupsService } from './consumer-groups.service';
import { BasketScheduleService } from './basket-schedule.service';
import { ConsumerGroupsController } from './consumer-groups.controller';
import { ConsumerGroupsAdminController } from './consumer-groups-admin.controller';
import { ConsumerGroupsPeriodsController } from './consumer-groups-periods.controller';
import { ConsumerGroupsOrdersController } from './consumer-groups-orders.controller';
import { ConsumerGroupsBasketScheduleController } from './consumer-groups-basket-schedule.controller';
import { ConsumerGroup } from './entities/consumer-group.entity';
import { UserConsumerGroup } from './entities/user-consumer-group.entity';
import { GroupInvitation } from './entities/group-invitation.entity';
import { BasketScheduleConfig } from './entities/basket-schedule-config.entity';
import { BasketScheduleVote } from './entities/basket-schedule-vote.entity';
import { BasketScheduleAssignment } from './entities/basket-schedule-assignment.entity';
import { User } from '../users/entities/user.entity';
import { StorageModule } from '../storage/storage.module';
import { PeriodsModule } from '../periods/periods.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsumerGroup,
      UserConsumerGroup,
      GroupInvitation,
      BasketScheduleConfig,
      BasketScheduleVote,
      BasketScheduleAssignment,
      User,
    ]),
    StorageModule,
    PeriodsModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [
    ConsumerGroupsController,
    ConsumerGroupsAdminController,
    ConsumerGroupsPeriodsController,
    ConsumerGroupsOrdersController,
    ConsumerGroupsBasketScheduleController,
  ],
  providers: [ConsumerGroupsService, BasketScheduleService],
  exports: [ConsumerGroupsService],
})
export class ConsumerGroupsModule {}

