import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para añadir la columna is_delivered a la tabla orders si no existe.
 * Esta columna debería estar en la migración inicial, pero puede faltar si la tabla
 * se creó antes de que se añadiera esta columna.
 */
export class AddIsDeliveredToOrders1737000000000 implements MigrationInterface {
  name = 'AddIsDeliveredToOrders1737000000000';

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

    // Verificar si la columna is_delivered ya existe
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'is_delivered'
      );
    `);

    if (columnExists[0]?.exists) {
      console.log('✅ Column "is_delivered" already exists in table "orders"');
      return;
    }

    // Añadir la columna is_delivered
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD COLUMN "is_delivered" boolean NOT NULL DEFAULT false;
    `);

    console.log('✅ Successfully added is_delivered column to orders table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna is_delivered
    await queryRunner.query(`
      ALTER TABLE "orders" 
      DROP COLUMN IF EXISTS "is_delivered";
    `);
  }
}

