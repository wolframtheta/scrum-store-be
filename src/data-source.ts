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

// Importar migraciones
import { InitialSchema1735152000000 } from '../migrations/1735152000000-InitialSchema1735152000000';
import { AddPreparerRole1736080000000 } from '../migrations/1736080000000-AddPreparerRole';
import { AddSystemConfig1736100000000 } from '../migrations/1736100000000-AddSystemConfig';
import { AddPreparerRoleToEnum1736200000000 } from '../migrations/1736200000000-AddPreparerRoleToEnum';
import { FixSalesUserEmailType1736300000000 } from '../migrations/1736300000000-FixSalesUserEmailType';
import { AddPaymentStatusToOrders1736400000000 } from '../migrations/1736400000000-AddPaymentStatusToOrders';
import { AllowArticleDeletionInOrders1736500000000 } from '../migrations/1736500000000-AllowArticleDeletionInOrders';
import { AddIsEcoToArticles1736600000000 } from '../migrations/1736600000000-AddIsEcoToArticles';
import { AddTaxRateToArticles1736700000000 } from '../migrations/1736700000000-AddTaxRateToArticles';
import { AddTotalAmountToOrders1736800000000 } from '../migrations/1736800000000-AddTotalAmountToOrders';
import { AddPaidAmountToOrders1736900000000 } from '../migrations/1736900000000-AddPaidAmountToOrders';
import { AddIsDeliveredToOrders1737000000000 } from '../migrations/1737000000000-AddIsDeliveredToOrders';
import { AddManatUnitMeasure1737100000000 } from '../migrations/1737100000000-AddManatUnitMeasure';
import { AddPeriodIdToOrderItems1737200000000 } from '../migrations/1737200000000-AddPeriodIdToOrderItems';
import { RenameTaxIdToCif1737300000000 } from '../migrations/1737300000000-RenameTaxIdToCif';
import { AddHashToArticles1737400000000 } from '../migrations/1737400000000-AddHashToArticles';
import { AddTransportCostToPeriods1737500000000 } from '../migrations/1737500000000-AddTransportCostToPeriods';
import { AddCustomizationOptions1769080326265 } from '../migrations/1769080326265-AddCustomizationOptions';

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
    InitialSchema1735152000000,
    AddPreparerRole1736080000000,
    AddSystemConfig1736100000000,
    AddPreparerRoleToEnum1736200000000,
    FixSalesUserEmailType1736300000000,
    AddPaymentStatusToOrders1736400000000,
    AllowArticleDeletionInOrders1736500000000,
    AddIsEcoToArticles1736600000000,
    AddTaxRateToArticles1736700000000,
    AddTotalAmountToOrders1736800000000,
    AddPaidAmountToOrders1736900000000,
    AddIsDeliveredToOrders1737000000000,
    AddManatUnitMeasure1737100000000,
    AddPeriodIdToOrderItems1737200000000,
    RenameTaxIdToCif1737300000000,
    AddHashToArticles1737400000000,
    AddTransportCostToPeriods1737500000000,
    AddCustomizationOptions1769080326265,
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

