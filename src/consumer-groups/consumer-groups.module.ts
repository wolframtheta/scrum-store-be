import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumerGroupsService } from './consumer-groups.service';
import { ConsumerGroupsController } from './consumer-groups.controller';
import { ConsumerGroupsAdminController } from './consumer-groups-admin.controller';
import { ConsumerGroup } from './entities/consumer-group.entity';
import { UserConsumerGroup } from './entities/user-consumer-group.entity';
import { GroupInvitation } from './entities/group-invitation.entity';
import { User } from '../users/entities/user.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsumerGroup, UserConsumerGroup, GroupInvitation, User]),
    StorageModule,
  ],
  controllers: [
    ConsumerGroupsController,
    ConsumerGroupsAdminController,
  ],
  providers: [ConsumerGroupsService],
  exports: [ConsumerGroupsService],
})
export class ConsumerGroupsModule {}

