import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migració per afegir la columna transport_tax_rate a la taula periods.
 */
export class AddTransportTaxRateToPeriods1737600000000 implements MigrationInterface {
  name = 'AddTransportTaxRateToPeriods1737600000000';

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

    // Verificar si la columna transport_tax_rate ja existeix
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'periods'
        AND column_name = 'transport_tax_rate'
      );
    `);

    if (columnExists[0]?.exists) {
      console.log('ℹ️  Column transport_tax_rate already exists in periods table');
      return;
    }

    // Afegir la columna transport_tax_rate amb valor per defecte 21%
    await queryRunner.query(`
      ALTER TABLE "periods" 
      ADD COLUMN "transport_tax_rate" numeric(5,2) NULL DEFAULT 21;
    `);

    console.log('✅ Successfully added transport_tax_rate column to periods table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna transport_tax_rate
    await queryRunner.query(`
      ALTER TABLE "periods" 
      DROP COLUMN IF EXISTS "transport_tax_rate";
    `);

    console.log('✅ Successfully removed transport_tax_rate column from periods table');
  }
}
