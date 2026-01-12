import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para añadir la columna total_amount a la tabla orders si no existe.
 * Esta columna debería estar en la migración inicial, pero puede faltar si la tabla
 * se creó antes de que se añadiera esta columna.
 */
export class AddTotalAmountToOrders1736800000000 implements MigrationInterface {
  name = 'AddTotalAmountToOrders1736800000000';

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

    // Verificar si la columna total_amount ya existe
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'total_amount'
      );
    `);

    if (columnExists[0]?.exists) {
      console.log('✅ Column "total_amount" already exists in table "orders"');
      return;
    }

    // Añadir la columna total_amount
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD COLUMN "total_amount" numeric(10,2) NOT NULL DEFAULT 0;
    `);

    console.log('✅ Successfully added total_amount column to orders table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna total_amount
    await queryRunner.query(`
      ALTER TABLE "orders" 
      DROP COLUMN IF EXISTS "total_amount";
    `);
  }
}

