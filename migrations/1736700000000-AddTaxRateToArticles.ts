import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para añadir la columna tax_rate a la tabla articles si no existe.
 * Esta columna debería estar en la migración inicial, pero puede faltar si la tabla
 * se creó antes de que se añadiera esta columna.
 */
export class AddTaxRateToArticles1736700000000 implements MigrationInterface {
  name = 'AddTaxRateToArticles1736700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'articles'
      );
    `);

    if (!tableExists[0]?.exists) {
      console.log('⚠️  Table "articles" does not exist, skipping');
      return;
    }

    // Verificar si la columna tax_rate ya existe
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'articles'
        AND column_name = 'tax_rate'
      );
    `);

    if (columnExists[0]?.exists) {
      console.log('✅ Column "tax_rate" already exists in table "articles"');
      return;
    }

    // Añadir la columna tax_rate
    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD COLUMN "tax_rate" numeric(5,2) NOT NULL DEFAULT 0;
    `);

    console.log('✅ Successfully added tax_rate column to articles table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna tax_rate
    await queryRunner.query(`
      ALTER TABLE "articles" 
      DROP COLUMN IF EXISTS "tax_rate";
    `);
  }
}

