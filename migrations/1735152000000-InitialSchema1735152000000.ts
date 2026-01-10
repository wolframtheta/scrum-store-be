import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1735152000000 implements MigrationInterface {
  name = 'InitialSchema1735152000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Habilitar extensión UUID si no existe
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Función auxiliar para crear enum solo si no existe
    const createEnumIfNotExists = async (enumName: string, values: string[]): Promise<void> => {
      const exists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = $1
        );
      `, [enumName]);
      
      if (!exists[0]?.exists) {
        const valuesStr = values.map(v => `'${v}'`).join(', ');
        await queryRunner.query(`
          CREATE TYPE "public"."${enumName}" AS ENUM(${valuesStr});
        `);
      }
    };

    // Crear enum types solo si no existen
    await createEnumIfNotExists('users_roles_enum', ['super_admin', 'admin', 'client']);
    await createEnumIfNotExists('articles_unit_measure_enum', ['g', 'kg', 'ml', 'cl', 'l', 'unit']);
    await createEnumIfNotExists('orders_payment_status_enum', ['unpaid', 'partial', 'paid']);
    await createEnumIfNotExists('sales_payment_status_enum', ['unpaid', 'partial', 'paid']);
    await createEnumIfNotExists('periods_recurrence_enum', ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom']);

    // Tabla users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "surname" character varying(255) NOT NULL,
        "phone" character varying(50),
        "profile_image" character varying(500),
        "password" character varying(255) NOT NULL,
        "roles" "public"."users_roles_enum"[] NOT NULL DEFAULT ARRAY['client']::"public"."users_roles_enum"[],
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Tabla consumer_groups
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "consumer_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "city" character varying(255) NOT NULL,
        "address" text,
        "image" character varying(500),
        "opening_schedule" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_consumer_groups_email" UNIQUE ("email"),
        CONSTRAINT "PK_consumer_groups" PRIMARY KEY ("id")
      )
    `);

    // Tabla refresh_tokens
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_email" character varying(255) NOT NULL,
        "token" character varying(500) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "revoked" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
      )
    `);

    // Tabla suppliers
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "tax_id" character varying(50),
        "email" character varying(255),
        "phone" character varying(50),
        "city" character varying(255),
        "address" text,
        "postal_code" character varying(50),
        "bank_account" text,
        "notes" text,
        "consumer_group_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suppliers" PRIMARY KEY ("id")
      )
    `);

    // Tabla producers
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "producers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "supplier_id" uuid,
        "email" character varying(255),
        "phone" character varying(50),
        "city" character varying(255),
        "address" text,
        "notes" text,
        "consumer_group_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_producers" PRIMARY KEY ("id")
      )
    `);

    // Tabla articles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "articles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "category" character varying(100) NOT NULL,
        "product" character varying(255) NOT NULL,
        "variety" character varying(255),
        "description" text,
        "image" character varying(500),
        "unit_measure" "public"."articles_unit_measure_enum" NOT NULL,
        "price_per_unit" numeric(10,2) NOT NULL,
        "city" character varying(255),
        "producer_id" uuid,
        "is_eco" boolean NOT NULL DEFAULT false,
        "tax_rate" numeric(5,2) NOT NULL DEFAULT 0,
        "consumer_group_id" uuid NOT NULL,
        "in_showcase" boolean NOT NULL DEFAULT false,
        "is_seasonal" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_articles" PRIMARY KEY ("id")
      )
    `);

    // Tabla article_price_history
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "article_price_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "article_id" uuid NOT NULL,
        "price_per_unit" numeric(10,2) NOT NULL,
        "changed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_article_price_history" PRIMARY KEY ("id")
      )
    `);

    // Tabla categories
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "category" character varying(100) NOT NULL,
        "product" character varying(255),
        "variety" character varying(255),
        "consumer_group_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    // Tabla periods
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "periods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "supplier_id" uuid NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "delivery_date" date NOT NULL,
        "recurrence" "public"."periods_recurrence_enum" NOT NULL DEFAULT 'custom',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_periods" PRIMARY KEY ("id")
      )
    `);

    // Tabla period_articles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "period_articles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "period_id" uuid NOT NULL,
        "article_id" uuid NOT NULL,
        "price_per_unit" numeric(10,2) NOT NULL,
        CONSTRAINT "PK_period_articles" PRIMARY KEY ("id")
      )
    `);

    // Tabla orders
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "consumer_group_id" uuid NOT NULL,
        "total_amount" numeric(10,2) NOT NULL,
        "paid_amount" numeric(10,2) NOT NULL DEFAULT 0,
        "payment_status" "public"."orders_payment_status_enum" NOT NULL DEFAULT 'unpaid',
        "is_delivered" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);

    // Tabla order_items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "article_id" uuid NOT NULL,
        "quantity" numeric(10,3) NOT NULL,
        "price_per_unit" numeric(10,2) NOT NULL,
        "total_price" numeric(10,2) NOT NULL,
        "paid_amount" numeric(10,2) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id")
      )
    `);

    // Tabla sales
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_email" character varying(255) NOT NULL,
        "consumer_group_id" uuid NOT NULL,
        "total_amount" numeric(10,2) NOT NULL,
        "paid_amount" numeric(10,2) NOT NULL DEFAULT 0,
        "payment_status" "public"."sales_payment_status_enum" NOT NULL DEFAULT 'unpaid',
        "is_delivered" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales" PRIMARY KEY ("id")
      )
    `);

    // Tabla sale_items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sale_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sale_id" uuid NOT NULL,
        "article_id" uuid NOT NULL,
        "quantity" numeric(10,3) NOT NULL,
        "price_per_unit" numeric(10,2) NOT NULL,
        "total_price" numeric(10,2) NOT NULL,
        "paid_amount" numeric(10,2) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_sale_items" PRIMARY KEY ("id")
      )
    `);

    // Tabla notices
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "content" text NOT NULL,
        "imageUrl" character varying(255),
        "authorEmail" character varying(255) NOT NULL,
        "groupId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notices" PRIMARY KEY ("id")
      )
    `);

    // Tabla user_consumer_groups
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_consumer_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_email" character varying(255) NOT NULL,
        "consumer_group_id" uuid NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "is_client" boolean NOT NULL DEFAULT true,
        "is_manager" boolean NOT NULL DEFAULT false,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_consumer_groups" PRIMARY KEY ("id")
      )
    `);

    // Tabla group_invitations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token" character varying(255) NOT NULL,
        "consumer_group_id" uuid NOT NULL,
        "invited_by" character varying(255) NOT NULL,
        "invited_email" character varying(255),
        "is_manager" boolean NOT NULL DEFAULT true,
        "is_client" boolean NOT NULL DEFAULT true,
        "expires_at" TIMESTAMP,
        "is_used" boolean NOT NULL DEFAULT false,
        "used_by" character varying(255),
        "used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_group_invitations_token" UNIQUE ("token"),
        CONSTRAINT "PK_group_invitations" PRIMARY KEY ("id")
      )
    `);

    // Función auxiliar para crear foreign key solo si no existe y los tipos coinciden
    const addForeignKeyIfNotExists = async (
      tableName: string,
      constraintName: string,
      column: string,
      referencedTable: string,
      referencedColumn: string,
      onDelete: string = 'CASCADE'
    ): Promise<void> => {
      // Verificar si la constraint ya existe
      const constraintExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = $1 AND table_name = $2
        );
      `, [constraintName, tableName]);
      
      if (constraintExists[0]?.exists) {
        return; // La constraint ya existe, no hacer nada
      }

      // Verificar que los tipos de datos coincidan
      const columnTypes = await queryRunner.query(`
        SELECT 
          (SELECT data_type FROM information_schema.columns 
           WHERE table_name = $1 AND column_name = $2) as source_type,
          (SELECT data_type FROM information_schema.columns 
           WHERE table_name = $3 AND column_name = $4) as target_type;
      `, [tableName, column, referencedTable, referencedColumn]);

      const sourceType = columnTypes[0]?.source_type;
      const targetType = columnTypes[0]?.target_type;

      // Si los tipos no coinciden, no crear la foreign key y mostrar advertencia
      if (sourceType && targetType && sourceType !== targetType) {
        console.warn(
          `⚠️  Skipping foreign key ${constraintName}: type mismatch ` +
          `(${tableName}.${column} is ${sourceType}, ` +
          `${referencedTable}.${referencedColumn} is ${targetType})`
        );
        return;
      }

      // Crear la foreign key
      try {
        await queryRunner.query(`
          ALTER TABLE "${tableName}" 
          ADD CONSTRAINT "${constraintName}" 
          FOREIGN KEY ("${column}") REFERENCES "${referencedTable}"("${referencedColumn}") ON DELETE ${onDelete}
        `);
      } catch (error: any) {
        // Si falla por incompatibilidad de tipos u otro error, mostrar advertencia pero no fallar
        if (error.code === '42804' || error.code === '42830') {
          console.warn(
            `⚠️  Could not create foreign key ${constraintName}: ${error.message}`
          );
        } else {
          throw error; // Re-lanzar otros errores
        }
      }
    };

    // Foreign keys
    await addForeignKeyIfNotExists('refresh_tokens', 'FK_refresh_tokens_user_email', 'user_email', 'users', 'email');
    await addForeignKeyIfNotExists('suppliers', 'FK_suppliers_consumer_group_id', 'consumer_group_id', 'consumer_groups', 'id');
    await addForeignKeyIfNotExists('producers', 'FK_producers_supplier_id', 'supplier_id', 'suppliers', 'id', 'SET NULL');
    await addForeignKeyIfNotExists('producers', 'FK_producers_consumer_group_id', 'consumer_group_id', 'consumer_groups', 'id');
    await addForeignKeyIfNotExists('articles', 'FK_articles_producer_id', 'producer_id', 'producers', 'id', 'SET NULL');
    await addForeignKeyIfNotExists('articles', 'FK_articles_consumer_group_id', 'consumer_group_id', 'consumer_groups', 'id');
    await addForeignKeyIfNotExists('article_price_history', 'FK_article_price_history_article_id', 'article_id', 'articles', 'id');
    await addForeignKeyIfNotExists('categories', 'FK_categories_consumer_group_id', 'consumer_group_id', 'consumer_groups', 'id');
    await addForeignKeyIfNotExists('periods', 'FK_periods_supplier_id', 'supplier_id', 'suppliers', 'id');
    await addForeignKeyIfNotExists('period_articles', 'FK_period_articles_period_id', 'period_id', 'periods', 'id');
    await addForeignKeyIfNotExists('period_articles', 'FK_period_articles_article_id', 'article_id', 'articles', 'id');
    await addForeignKeyIfNotExists('orders', 'FK_orders_user_id', 'user_id', 'users', 'id');
    await addForeignKeyIfNotExists('orders', 'FK_orders_consumer_group_id', 'consumer_group_id', 'consumer_groups', 'id');
    await addForeignKeyIfNotExists('order_items', 'FK_order_items_order_id', 'order_id', 'orders', 'id');
    await addForeignKeyIfNotExists('order_items', 'FK_order_items_article_id', 'article_id', 'articles', 'id', 'RESTRICT');
    await addForeignKeyIfNotExists('sales', 'FK_sales_user_email', 'user_email', 'users', 'email');
    await addForeignKeyIfNotExists('sales', 'FK_sales_consumer_group_id', 'consumer_group_id', 'consumer_groups', 'id');
    await addForeignKeyIfNotExists('sale_items', 'FK_sale_items_sale_id', 'sale_id', 'sales', 'id');
    await addForeignKeyIfNotExists('sale_items', 'FK_sale_items_article_id', 'article_id', 'articles', 'id', 'RESTRICT');
    await addForeignKeyIfNotExists('notices', 'FK_notices_groupId', 'groupId', 'consumer_groups', 'id');
    await addForeignKeyIfNotExists('user_consumer_groups', 'FK_user_consumer_groups_user_email', 'user_email', 'users', 'email');
    await addForeignKeyIfNotExists('user_consumer_groups', 'FK_user_consumer_groups_consumer_group_id', 'consumer_group_id', 'consumer_groups', 'id');

    // Función auxiliar para crear índice solo si las columnas existen
    const createIndexIfColumnsExist = async (
      indexName: string,
      tableName: string,
      columns: string[],
      unique: boolean = false
    ): Promise<void> => {
      // Verificar si el índice ya existe
      const indexExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE indexname = $1
        );
      `, [indexName]);

      if (indexExists[0]?.exists) {
        return; // El índice ya existe
      }

      // Verificar que todas las columnas existan
      const columnChecks = await Promise.all(
        columns.map(col => 
          queryRunner.query(`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = $1
              AND column_name = $2
            );
          `, [tableName, col])
        )
      );

      const allColumnsExist = columnChecks.every(check => check[0]?.exists);

      if (!allColumnsExist) {
        const missingColumns = columns.filter((col, idx) => !columnChecks[idx][0]?.exists);
        console.warn(
          `⚠️  Skipping index ${indexName}: columns ${missingColumns.join(', ')} do not exist in table ${tableName}`
        );
        return;
      }

      // Crear el índice
      const uniqueKeyword = unique ? 'UNIQUE' : '';
      const columnsStr = columns.map(c => `"${c}"`).join(', ');
      await queryRunner.query(`
        CREATE ${uniqueKeyword} INDEX IF NOT EXISTS "${indexName}" 
        ON "${tableName}" (${columnsStr})
      `);
    };

    // Índices
    await createIndexIfColumnsExist(
      'IDX_articles_consumer_group_showcase',
      'articles',
      ['consumer_group_id', 'in_showcase']
    );

    await createIndexIfColumnsExist(
      'IDX_article_price_history_article_changed',
      'article_price_history',
      ['article_id', 'changed_at']
    );

    await createIndexIfColumnsExist(
      'IDX_periods_supplier_start',
      'periods',
      ['supplier_id', 'start_date']
    );

    await createIndexIfColumnsExist(
      'IDX_period_articles_period_article',
      'period_articles',
      ['period_id', 'article_id']
    );

    await createIndexIfColumnsExist(
      'IDX_orders_user_consumer_group',
      'orders',
      ['user_id', 'consumer_group_id']
    );

    await createIndexIfColumnsExist(
      'IDX_orders_consumer_group_payment',
      'orders',
      ['consumer_group_id', 'payment_status']
    );

    await createIndexIfColumnsExist(
      'IDX_sales_user_consumer_group',
      'sales',
      ['user_email', 'consumer_group_id']
    );

    await createIndexIfColumnsExist(
      'IDX_sales_consumer_group_payment',
      'sales',
      ['consumer_group_id', 'payment_status']
    );

    await createIndexIfColumnsExist(
      'IDX_user_consumer_groups_unique',
      'user_consumer_groups',
      ['user_email', 'consumer_group_id'],
      true // unique
    );

    await createIndexIfColumnsExist(
      'IDX_group_invitations_token',
      'group_invitations',
      ['token'],
      true // unique
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_group_invitations_token"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_consumer_groups_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_consumer_group_payment"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_user_consumer_group"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_consumer_group_payment"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_user_consumer_group"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_period_articles_period_article"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_periods_supplier_start"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_price_history_article_changed"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_articles_consumer_group_showcase"`);

    // Eliminar foreign keys
    await queryRunner.query(`ALTER TABLE "user_consumer_groups" DROP CONSTRAINT IF EXISTS "FK_user_consumer_groups_consumer_group_id"`);
    await queryRunner.query(`ALTER TABLE "user_consumer_groups" DROP CONSTRAINT IF EXISTS "FK_user_consumer_groups_user_email"`);
    await queryRunner.query(`ALTER TABLE "notices" DROP CONSTRAINT IF EXISTS "FK_notices_groupId"`);
    await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "FK_sale_items_article_id"`);
    await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "FK_sale_items_sale_id"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "FK_sales_consumer_group_id"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "FK_sales_user_email"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "FK_order_items_article_id"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "FK_order_items_order_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_orders_consumer_group_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_orders_user_id"`);
    await queryRunner.query(`ALTER TABLE "period_articles" DROP CONSTRAINT IF EXISTS "FK_period_articles_article_id"`);
    await queryRunner.query(`ALTER TABLE "period_articles" DROP CONSTRAINT IF EXISTS "FK_period_articles_period_id"`);
    await queryRunner.query(`ALTER TABLE "periods" DROP CONSTRAINT IF EXISTS "FK_periods_supplier_id"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_consumer_group_id"`);
    await queryRunner.query(`ALTER TABLE "article_price_history" DROP CONSTRAINT IF EXISTS "FK_article_price_history_article_id"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "FK_articles_consumer_group_id"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "FK_articles_producer_id"`);
    await queryRunner.query(`ALTER TABLE "producers" DROP CONSTRAINT IF EXISTS "FK_producers_consumer_group_id"`);
    await queryRunner.query(`ALTER TABLE "producers" DROP CONSTRAINT IF EXISTS "FK_producers_supplier_id"`);
    await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT IF EXISTS "FK_suppliers_consumer_group_id"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_user_email"`);

    // Eliminar tablas
    await queryRunner.query(`DROP TABLE IF EXISTS "group_invitations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_consumer_groups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sale_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "period_articles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "periods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "article_price_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "articles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "producers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consumer_groups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Eliminar enums
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."periods_recurrence_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."sales_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."orders_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."articles_unit_measure_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_roles_enum"`);
  }
}

