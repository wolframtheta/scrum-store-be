import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodsService } from './periods.service';
import { PeriodsController } from './periods.controller';
import { Period } from './entities/period.entity';
import { PeriodArticle } from './entities/period-article.entity';
import { Order } from '../orders/entities/order.entity';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { ConsumerGroupsModule } from '../consumer-groups/consumer-groups.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Period, PeriodArticle, Order]),
    SuppliersModule,
    forwardRef(() => ConsumerGroupsModule),
    MailModule,
  ],
  controllers: [PeriodsController],
  providers: [PeriodsService],
  exports: [PeriodsService],
})
export class PeriodsModule {}

