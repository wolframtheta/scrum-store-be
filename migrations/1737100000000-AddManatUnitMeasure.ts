import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManatUnitMeasure1737100000000 implements MigrationInterface {
  name = 'AddManatUnitMeasure1737100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Afegir 'manat' a l'enum articles_unit_measure_enum si no existeix
    const enumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'manat' 
        AND enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'articles_unit_measure_enum'
        )
      );
    `);

    if (!enumExists[0]?.exists) {
      await queryRunner.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'manat' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'articles_unit_measure_enum')
          ) THEN
            ALTER TYPE "public"."articles_unit_measure_enum" ADD VALUE 'manat';
          END IF;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL no permet eliminar valors d'un enum directament
    console.warn('⚠️  Reverting this migration requires recreating the enum type, which is complex.');
    console.warn('⚠️  This operation is not automatically reversible.');
  }
}


