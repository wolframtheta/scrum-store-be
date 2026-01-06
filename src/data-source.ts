import { DataSource } from 'typeorm';
import * as path from 'path';
import { loadEnvFiles } from './config/env.config';

// Carregar arxius d'environment segons l'entorn
loadEnvFiles();

// Importar todas las entidades
import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { ConsumerGroup } from './consumer-groups/entities/consumer-group.entity';
import { UserConsumerGroup } from './consumer-groups/entities/user-consumer-group.entity';
import { GroupInvitation } from './consumer-groups/entities/group-invitation.entity';
import { Article } from './articles/entities/article.entity';
import { ArticlePriceHistory } from './articles/entities/article-price-history.entity';
import { Category } from './categories/entities/category.entity';
import { Producer } from './producers/entities/producer.entity';
import { Supplier } from './suppliers/entities/supplier.entity';
import { Sale } from './sales/entities/sale.entity';
import { SaleItem } from './sales/entities/sale-item.entity';
import { Notice } from './notices/entities/notice.entity';
import { Period } from './periods/entities/period.entity';
import { PeriodArticle } from './periods/entities/period-article.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'scrum_store',
  entities: [
    User,
    RefreshToken,
    ConsumerGroup,
    UserConsumerGroup,
    GroupInvitation,
    Article,
    ArticlePriceHistory,
    Category,
    Producer,
    Supplier,
    Sale,
    SaleItem,
    Notice,
    Period,
    PeriodArticle,
    Order,
    OrderItem,
  ],
  migrations: [
    // Usar ruta absoluta per assegurar que es carreguen correctament
    path.resolve(process.cwd(), 'migrations', '*.ts'),
    path.resolve(process.cwd(), 'migrations', '*.js'),
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

