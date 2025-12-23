import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { ArticlesModule } from '../articles/articles.module';
import { ConsumerGroupsModule } from '../consumer-groups/consumer-groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    ArticlesModule,
    ConsumerGroupsModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}










