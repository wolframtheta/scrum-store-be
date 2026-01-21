import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para añadir la columna hash a la tabla articles.
 * El hash se genera a partir de: proveedor + categoría + producto + variedad
 * para evitar duplicados y facilitar la identificación de artículos existentes.
 */
export class AddHashToArticles1737400000000 implements MigrationInterface {
  name = 'AddHashToArticles1737400000000';

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

    // Habilitar extensión pgcrypto para usar digest (debe estar antes de crear la columna)
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    // Verificar si la columna hash ya existe
    const columnExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'articles'
        AND column_name = 'hash'
      );
    `);

    let columnJustCreated = false;
    if (!columnExists[0]?.exists) {
      // Añadir la columna hash
      await queryRunner.query(`
        ALTER TABLE "articles" 
        ADD COLUMN "hash" varchar(64);
      `);
      columnJustCreated = true;
    }

    // Crear índice para mejorar las búsquedas por hash
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_articles_hash" ON "articles" ("hash");
    `);

    // Generar hashes para artículos existentes que no tienen hash
    // El hash se genera a partir de: proveedor + categoría + producto + variedad
    // Usamos la función digest de PostgreSQL para generar SHA-256
    // Todos los valores se convierten a mayúsculas
    // Primero para artículos con productor que no tienen hash
    await queryRunner.query(`
      UPDATE "articles" a
      SET "hash" = encode(
        digest(
          UPPER(COALESCE(TRIM(p.name), '')) || '|' ||
          UPPER(COALESCE(TRIM(a.category), '')) || '|' ||
          UPPER(COALESCE(TRIM(a.product), '')) || '|' ||
          UPPER(COALESCE(TRIM(a.variety), '')),
          'sha256'
        ),
        'hex'
      )
      FROM "producers" p
      WHERE a.producer_id = p.id AND (a.hash IS NULL OR a.hash = '');
    `);

    // Para artículos sin productor que no tienen hash, generar hash sin nombre de productor
    await queryRunner.query(`
      UPDATE "articles"
      SET "hash" = encode(
        digest(
          '|' ||
          UPPER(COALESCE(TRIM(category), '')) || '|' ||
          UPPER(COALESCE(TRIM(product), '')) || '|' ||
          UPPER(COALESCE(TRIM(variety), '')),
          'sha256'
        ),
        'hex'
      )
      WHERE producer_id IS NULL AND (hash IS NULL OR hash = '');
    `);

    if (columnJustCreated) {
      console.log('✅ Successfully added hash column to articles table and generated hashes for existing articles');
    } else {
      console.log('✅ Generated hashes for articles that were missing them');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar el índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_articles_hash";
    `);

    // Eliminar la columna hash
    await queryRunner.query(`
      ALTER TABLE "articles" 
      DROP COLUMN IF EXISTS "hash";
    `);
  }
}
