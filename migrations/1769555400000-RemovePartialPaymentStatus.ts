import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para eliminar el estado 'partial' del enum PaymentStatus.
 * Actualiza todos los registros con 'partial' a 'unpaid' y elimina el valor del enum.
 */
export class RemovePartialPaymentStatus1769555400000 implements MigrationInterface {
  name = 'RemovePartialPaymentStatus1769555400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear nuevo enum sin 'partial' para orders
    await queryRunner.query(`
      CREATE TYPE "public"."orders_payment_status_enum_new" AS ENUM('unpaid', 'paid');
    `);

    // Cambiar la columna al nuevo tipo, convirtiendo 'partial' a 'unpaid' durante la conversión
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ALTER COLUMN "payment_status" DROP DEFAULT;
    `);

    await queryRunner.query(`
      ALTER TABLE "orders" 
      ALTER COLUMN "payment_status" TYPE "public"."orders_payment_status_enum_new" 
      USING CASE 
        WHEN "payment_status"::text = 'partial' THEN 'unpaid'::"public"."orders_payment_status_enum_new"
        ELSE "payment_status"::text::"public"."orders_payment_status_enum_new"
      END;
    `);

    await queryRunner.query(`
      ALTER TABLE "orders" 
      ALTER COLUMN "payment_status" SET DEFAULT 'unpaid'::"public"."orders_payment_status_enum_new";
    `);

    await queryRunner.query(`
      DROP TYPE "public"."orders_payment_status_enum";
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."orders_payment_status_enum_new" 
      RENAME TO "orders_payment_status_enum";
    `);

    // Crear nuevo enum sin 'partial' para sales
    await queryRunner.query(`
      CREATE TYPE "public"."sales_payment_status_enum_new" AS ENUM('unpaid', 'paid');
    `);

    // Cambiar la columna al nuevo tipo, convirtiendo 'partial' a 'unpaid' durante la conversión
    await queryRunner.query(`
      ALTER TABLE "sales" 
      ALTER COLUMN "payment_status" DROP DEFAULT;
    `);

    await queryRunner.query(`
      ALTER TABLE "sales" 
      ALTER COLUMN "payment_status" TYPE "public"."sales_payment_status_enum_new" 
      USING CASE 
        WHEN "payment_status"::text = 'partial' THEN 'unpaid'::"public"."sales_payment_status_enum_new"
        ELSE "payment_status"::text::"public"."sales_payment_status_enum_new"
      END;
    `);

    await queryRunner.query(`
      ALTER TABLE "sales" 
      ALTER COLUMN "payment_status" SET DEFAULT 'unpaid'::"public"."sales_payment_status_enum_new";
    `);

    await queryRunner.query(`
      DROP TYPE "public"."sales_payment_status_enum";
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."sales_payment_status_enum_new" 
      RENAME TO "sales_payment_status_enum";
    `);

    console.log('✅ Successfully removed "partial" from PaymentStatus enums');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recrear los enums con 'partial'
    await queryRunner.query(`
      CREATE TYPE "public"."orders_payment_status_enum_new" AS ENUM('unpaid', 'partial', 'paid');
    `);

    await queryRunner.query(`
      ALTER TABLE "orders" 
      ALTER COLUMN "payment_status" TYPE "public"."orders_payment_status_enum_new" 
      USING "payment_status"::text::"public"."orders_payment_status_enum_new";
    `);

    await queryRunner.query(`
      DROP TYPE "public"."orders_payment_status_enum";
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."orders_payment_status_enum_new" 
      RENAME TO "orders_payment_status_enum";
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."sales_payment_status_enum_new" AS ENUM('unpaid', 'partial', 'paid');
    `);

    await queryRunner.query(`
      ALTER TABLE "sales" 
      ALTER COLUMN "payment_status" TYPE "public"."sales_payment_status_enum_new" 
      USING "payment_status"::text::"public"."sales_payment_status_enum_new";
    `);

    await queryRunner.query(`
      DROP TYPE "public"."sales_payment_status_enum";
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."sales_payment_status_enum_new" 
      RENAME TO "sales_payment_status_enum";
    `);
  }
}
