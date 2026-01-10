import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para permitir borrar artículos aunque estén en comandas.
 * Cambia la foreign key de RESTRICT a SET NULL y hace article_id nullable.
 */
export class AllowArticleDeletionInOrders1736500000000 implements MigrationInterface {
  name = 'AllowArticleDeletionInOrders1736500000000';

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

    // Eliminar la foreign key constraint existente si existe
    const constraintExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
        AND table_name = 'order_items'
        AND constraint_name LIKE '%article_id%'
      );
    `);

    if (constraintExists[0]?.exists) {
      // Buscar el nombre exacto de la constraint
      const constraintName = await queryRunner.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
        AND table_name = 'order_items'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%article%'
        LIMIT 1;
      `);

      if (constraintName[0]?.constraint_name) {
        await queryRunner.query(`
          ALTER TABLE "order_items" 
          DROP CONSTRAINT IF EXISTS "${constraintName[0].constraint_name}";
        `);
        console.log(`✅ Dropped constraint ${constraintName[0].constraint_name}`);
      }
    }

    // Hacer la columna article_id nullable
    await queryRunner.query(`
      ALTER TABLE "order_items" 
      ALTER COLUMN "article_id" DROP NOT NULL;
    `);
    console.log('✅ Made article_id nullable');

    // Recrear la foreign key con SET NULL
    await queryRunner.query(`
      ALTER TABLE "order_items" 
      ADD CONSTRAINT "FK_order_items_article_id" 
      FOREIGN KEY ("article_id") 
      REFERENCES "articles"("id") 
      ON DELETE SET NULL;
    `);
    console.log('✅ Created foreign key with SET NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "order_items" 
      DROP CONSTRAINT IF EXISTS "FK_order_items_article_id";
    `);

    // Hacer la columna article_id NOT NULL (solo si no hay valores null)
    await queryRunner.query(`
      ALTER TABLE "order_items" 
      ALTER COLUMN "article_id" SET NOT NULL;
    `);

    // Recrear la foreign key con RESTRICT
    await queryRunner.query(`
      ALTER TABLE "order_items" 
      ADD CONSTRAINT "FK_order_items_article_id" 
      FOREIGN KEY ("article_id") 
      REFERENCES "articles"("id") 
      ON DELETE RESTRICT;
    `);
  }
}

