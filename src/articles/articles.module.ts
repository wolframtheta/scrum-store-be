import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';
import { ArticlePriceHistory } from './entities/article-price-history.entity';
import { Producer } from '../producers/entities/producer.entity';
import { ConsumerGroupsModule } from '../consumer-groups/consumer-groups.module';
import { StorageModule } from '../storage/storage.module';
import { CoreModule } from '../core/core.module';
import { PeriodsModule } from '../periods/periods.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, ArticlePriceHistory, Producer]),
    forwardRef(() => ConsumerGroupsModule),
    StorageModule,
    forwardRef(() => CoreModule),
    forwardRef(() => PeriodsModule),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}


