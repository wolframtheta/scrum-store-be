import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para añadir la columna paid_amount a la tabla orders si no existe.
 * Esta columna debería estar en la migración inicial, pero puede faltar si la tabla
 * se creó antes de que se añadiera esta columna.
 */
export class AddPaidAmountToOrders1736900000000 implements MigrationInterface {
  name = 'AddPaidAmountToOrders1736900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);

    if (!tableExists[0]?.exists) {
      console.log('⚠️  Table "orders" does not exist, skipping');
      return;
    }

    // Verificar si la columna paid_amount ya existe
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'paid_amount'
      );
    `);

    if (columnExists[0]?.exists) {
      console.log('✅ Column "paid_amount" already exists in table "orders"');
      return;
    }

    // Añadir la columna paid_amount
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD COLUMN "paid_amount" numeric(10,2) NOT NULL DEFAULT 0;
    `);

    console.log('✅ Successfully added paid_amount column to orders table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna paid_amount
    await queryRunner.query(`
      ALTER TABLE "orders" 
      DROP COLUMN IF EXISTS "paid_amount";
    `);
  }
}

