import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConsumerGroupsModule } from './consumer-groups/consumer-groups.module';
import { ArticlesModule } from './articles/articles.module';
import { CategoriesModule } from './categories/categories.module';
import { ProducersModule } from './producers/producers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SalesModule } from './sales/sales.module';
import { StorageModule } from './storage/storage.module';
import { CoreModule } from './core/core.module';
import { NoticesModule } from './notices/notices.module';
import { PeriodsModule } from './periods/periods.module';
import { OrdersModule } from './orders/orders.module';
import { ConfigSystemModule } from './config-system/config-system.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import storageConfig from './config/storage.config';
import throttleConfig from './config/throttle.config';
import { getEnvFilePaths } from './config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, storageConfig, throttleConfig],
      envFilePath: getEnvFilePaths(),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('database');
        if (!config) {
          throw new Error('Database configuration not found');
        }
        return config;
      },
    }),
    CoreModule,
    StorageModule,
    UsersModule,
    AuthModule,
    ConsumerGroupsModule,
    ArticlesModule,
    CategoriesModule,
    ProducersModule,
    SuppliersModule,
    SalesModule,
    NoticesModule,
    PeriodsModule,
    OrdersModule,
    ConfigSystemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

