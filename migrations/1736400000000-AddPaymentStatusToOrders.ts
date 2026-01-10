import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para añadir la columna payment_status a las tablas orders y sales si no existe.
 */
export class AddPaymentStatusToOrders1736400000000 implements MigrationInterface {
  name = 'AddPaymentStatusToOrders1736400000000';

  // Función auxiliar para añadir payment_status a una tabla
  private async addPaymentStatusColumn(
    queryRunner: QueryRunner,
    tableName: string,
    enumName: string
  ): Promise<void> {
    // Verificar si la tabla existe
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);

    if (!tableExists[0]?.exists) {
      console.log(`⚠️  Table "${tableName}" does not exist, skipping`);
      return;
    }

    // Verificar si la columna payment_status ya existe
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = 'payment_status'
      );
    `, [tableName]);

    if (columnExists[0]?.exists) {
      console.log(`✅ Column "payment_status" already exists in table "${tableName}"`);
      return;
    }

    // Verificar si el enum existe
    const enumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = $1
      );
    `, [enumName]);

    if (!enumExists[0]?.exists) {
      // Crear el enum si no existe
      await queryRunner.query(`
        CREATE TYPE "public"."${enumName}" AS ENUM('unpaid', 'partial', 'paid');
      `);
    }

    // Añadir la columna payment_status
    await queryRunner.query(`
      ALTER TABLE "${tableName}" 
      ADD COLUMN "payment_status" "public"."${enumName}" NOT NULL DEFAULT 'unpaid';
    `);

    console.log(`✅ Successfully added payment_status column to ${tableName} table`);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addPaymentStatusColumn(queryRunner, 'orders', 'orders_payment_status_enum');
    await this.addPaymentStatusColumn(queryRunner, 'sales', 'sales_payment_status_enum');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar las columnas payment_status
    await queryRunner.query(`
      ALTER TABLE "orders" 
      DROP COLUMN IF EXISTS "payment_status";
    `);

    await queryRunner.query(`
      ALTER TABLE "sales" 
      DROP COLUMN IF EXISTS "payment_status";
    `);
  }
}

