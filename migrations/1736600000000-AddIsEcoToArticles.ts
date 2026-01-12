import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para añadir la columna is_eco a la tabla articles si no existe.
 * Esta columna debería estar en la migración inicial, pero puede faltar si la tabla
 * se creó antes de que se añadiera esta columna.
 */
export class AddIsEcoToArticles1736600000000 implements MigrationInterface {
  name = 'AddIsEcoToArticles1736600000000';

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

    // Verificar si la columna is_eco ya existe
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'articles'
        AND column_name = 'is_eco'
      );
    `);

    if (columnExists[0]?.exists) {
      console.log('✅ Column "is_eco" already exists in table "articles"');
      return;
    }

    // Añadir la columna is_eco
    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD COLUMN "is_eco" boolean NOT NULL DEFAULT false;
    `);

    console.log('✅ Successfully added is_eco column to articles table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna is_eco
    await queryRunner.query(`
      ALTER TABLE "articles" 
      DROP COLUMN IF EXISTS "is_eco";
    `);
  }
}

