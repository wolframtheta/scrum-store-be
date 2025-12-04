import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticesService } from './notices.service';
import { NoticesController } from './notices.controller';
import { Notice } from './entities/notice.entity';
import { ConsumerGroupsModule } from '../consumer-groups/consumer-groups.module';
import { StorageModule } from '../storage/storage.module';
import { CoreModule } from '../core/core.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notice]),
    ConsumerGroupsModule,
    StorageModule,
    CoreModule,
    UsersModule,
  ],
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class NoticesModule {}
