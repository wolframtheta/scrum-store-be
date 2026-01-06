import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodsService } from './periods.service';
import { PeriodsController } from './periods.controller';
import { Period } from './entities/period.entity';
import { PeriodArticle } from './entities/period-article.entity';
import { SuppliersModule } from '../suppliers/suppliers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Period, PeriodArticle]),
    SuppliersModule,
  ],
  controllers: [PeriodsController],
  providers: [PeriodsService],
  exports: [PeriodsService],
})
export class PeriodsModule {}

