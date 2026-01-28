import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para eliminar la columna paid_amount de la tabla order_items.
 * El paidAmount solo debe estar a nivel de comanda (order), no de item.
 */
export class RemovePaidAmountFromOrderItems1769591246000 implements MigrationInterface {
  name = 'RemovePaidAmountFromOrderItems1769591246000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items'
      );
    `);

    if (!tableExists[0]?.exists) {
      console.log('⚠️  Table "order_items" does not exist, skipping');
      return;
    }

    // Verificar si la columna existe
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'order_items'
        AND column_name = 'paid_amount'
      );
    `);

    if (!columnExists[0]?.exists) {
      console.log('✅ Column "paid_amount" does not exist in table "order_items", skipping');
      return;
    }

    // Eliminar la columna paid_amount
    await queryRunner.query(`
      ALTER TABLE "order_items" 
      DROP COLUMN IF EXISTS "paid_amount";
    `);

    console.log('✅ Successfully removed "paid_amount" column from order_items table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recrear la columna paid_amount
    await queryRunner.query(`
      ALTER TABLE "order_items" 
      ADD COLUMN "paid_amount" decimal(10,2) DEFAULT 0;
    `);
  }
}
