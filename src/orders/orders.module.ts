import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ArticlesModule } from '../articles/articles.module';
import { ConsumerGroupsModule } from '../consumer-groups/consumer-groups.module';
import { UsersModule } from '../users/users.module';
import { PeriodsModule } from '../periods/periods.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    forwardRef(() => ArticlesModule),
    forwardRef(() => ConsumerGroupsModule),
    forwardRef(() => UsersModule),
    PeriodsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService, TypeOrmModule]
})
export class OrdersModule {}










