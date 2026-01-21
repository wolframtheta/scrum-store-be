import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migració per afegir la columna transport_cost a la taula periods.
 * Aquest camp permet assignar un cost de transport per període que es repartirà entre totes les comandes.
 */
export class AddTransportCostToPeriods1737500000000 implements MigrationInterface {
  name = 'AddTransportCostToPeriods1737500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la taula existeix
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'periods'
      );
    `);

    if (!tableExists[0]?.exists) {
      console.log('⚠️  Table "periods" does not exist, skipping');
      return;
    }

    // Verificar si la columna transport_cost ja existeix
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'periods'
        AND column_name = 'transport_cost'
      );
    `);

    if (!columnExists[0]?.exists) {
      // Afegir la columna transport_cost
      await queryRunner.query(`
        ALTER TABLE "periods" 
        ADD COLUMN "transport_cost" decimal(10,2) NULL;
      `);
      console.log('✅ Successfully added transport_cost column to periods table');
    } else {
      console.log('ℹ️  Column transport_cost already exists in periods table');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna transport_cost
    await queryRunner.query(`
      ALTER TABLE "periods" 
      DROP COLUMN IF EXISTS "transport_cost";
    `);
    console.log('✅ Successfully removed transport_cost column from periods table');
  }
}
