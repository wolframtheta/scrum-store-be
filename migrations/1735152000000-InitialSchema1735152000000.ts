import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1735152000000 implements MigrationInterface {
  name = 'InitialSchema1735152000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Habilitar extensión UUID si no existe
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Crear enum types
    await queryRunner.query(`
      CREATE TYPE "public"."users_roles_enum" AS ENUM('super_admin', 'admin', 'client');
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."articles_unit_measure_enum" AS ENUM('g', 'kg', 'ml', 'cl', 'l', 'unit');
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."orders_payment_status_enum" AS ENUM('unpaid', 'partial', 'paid');
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."sales_payment_status_enum" AS ENUM('unpaid', 'partial', 'paid');
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."periods_recurrence_enum" AS ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom');
    `);

    // Tabla users
    await queryRunner.query(`
      CREATE TABLE "users" (
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
      CREATE TABLE "consumer_groups" (
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
      CREATE TABLE "refresh_tokens" (
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
      CREATE TABLE "suppliers" (
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
      CREATE TABLE "producers" (
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
      CREATE TABLE "articles" (
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
      CREATE TABLE "article_price_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "article_id" uuid NOT NULL,
        "price_per_unit" numeric(10,2) NOT NULL,
        "changed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_article_price_history" PRIMARY KEY ("id")
      )
    `);

    // Tabla categories
    await queryRunner.query(`
      CREATE TABLE "categories" (
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
      CREATE TABLE "periods" (
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
      CREATE TABLE "period_articles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "period_id" uuid NOT NULL,
        "article_id" uuid NOT NULL,
        "price_per_unit" numeric(10,2) NOT NULL,
        CONSTRAINT "PK_period_articles" PRIMARY KEY ("id")
      )
    `);

    // Tabla orders
    await queryRunner.query(`
      CREATE TABLE "orders" (
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
      CREATE TABLE "order_items" (
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
      CREATE TABLE "sales" (
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
      CREATE TABLE "sale_items" (
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
      CREATE TABLE "notices" (
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
      CREATE TABLE "user_consumer_groups" (
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
      CREATE TABLE "group_invitations" (
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

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" 
      ADD CONSTRAINT "FK_refresh_tokens_user_email" 
      FOREIGN KEY ("user_email") REFERENCES "users"("email") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "suppliers" 
      ADD CONSTRAINT "FK_suppliers_consumer_group_id" 
      FOREIGN KEY ("consumer_group_id") REFERENCES "consumer_groups"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "producers" 
      ADD CONSTRAINT "FK_producers_supplier_id" 
      FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "producers" 
      ADD CONSTRAINT "FK_producers_consumer_group_id" 
      FOREIGN KEY ("consumer_group_id") REFERENCES "consumer_groups"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD CONSTRAINT "FK_articles_producer_id" 
      FOREIGN KEY ("producer_id") REFERENCES "producers"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD CONSTRAINT "FK_articles_consumer_group_id" 
      FOREIGN KEY ("consumer_group_id") REFERENCES "consumer_groups"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "article_price_history" 
      ADD CONSTRAINT "FK_article_price_history_article_id" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD CONSTRAINT "FK_categories_consumer_group_id" 
      FOREIGN KEY ("consumer_group_id") REFERENCES "consumer_groups"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "periods" 
      ADD CONSTRAINT "FK_periods_supplier_id" 
      FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "period_articles" 
      ADD CONSTRAINT "FK_period_articles_period_id" 
      FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "period_articles" 
      ADD CONSTRAINT "FK_period_articles_article_id" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD CONSTRAINT "FK_orders_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD CONSTRAINT "FK_orders_consumer_group_id" 
      FOREIGN KEY ("consumer_group_id") REFERENCES "consumer_groups"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items" 
      ADD CONSTRAINT "FK_order_items_order_id" 
      FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items" 
      ADD CONSTRAINT "FK_order_items_article_id" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "sales" 
      ADD CONSTRAINT "FK_sales_user_email" 
      FOREIGN KEY ("user_email") REFERENCES "users"("email") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "sales" 
      ADD CONSTRAINT "FK_sales_consumer_group_id" 
      FOREIGN KEY ("consumer_group_id") REFERENCES "consumer_groups"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_items" 
      ADD CONSTRAINT "FK_sale_items_sale_id" 
      FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_items" 
      ADD CONSTRAINT "FK_sale_items_article_id" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "notices" 
      ADD CONSTRAINT "FK_notices_groupId" 
      FOREIGN KEY ("groupId") REFERENCES "consumer_groups"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "user_consumer_groups" 
      ADD CONSTRAINT "FK_user_consumer_groups_user_email" 
      FOREIGN KEY ("user_email") REFERENCES "users"("email") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_consumer_groups" 
      ADD CONSTRAINT "FK_user_consumer_groups_consumer_group_id" 
      FOREIGN KEY ("consumer_group_id") REFERENCES "consumer_groups"("id") ON DELETE CASCADE
    `);

    // Índices
    await queryRunner.query(`
      CREATE INDEX "IDX_articles_consumer_group_showcase" 
      ON "articles" ("consumer_group_id", "in_showcase")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_article_price_history_article_changed" 
      ON "article_price_history" ("article_id", "changed_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_periods_supplier_start" 
      ON "periods" ("supplier_id", "start_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_period_articles_period_article" 
      ON "period_articles" ("period_id", "article_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_user_consumer_group" 
      ON "orders" ("user_id", "consumer_group_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_consumer_group_payment" 
      ON "orders" ("consumer_group_id", "payment_status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_user_consumer_group" 
      ON "sales" ("user_email", "consumer_group_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_consumer_group_payment" 
      ON "sales" ("consumer_group_id", "payment_status")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_user_consumer_groups_unique" 
      ON "user_consumer_groups" ("user_email", "consumer_group_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_group_invitations_token" 
      ON "group_invitations" ("token")
    `);
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

