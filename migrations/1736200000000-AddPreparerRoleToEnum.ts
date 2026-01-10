import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreparerRoleToEnum1736200000000 implements MigrationInterface {
  name = 'AddPreparerRoleToEnum1736200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Añadir 'preparer' al enum users_roles_enum si no existe
    // Primero verificamos si el valor ya existe
    const enumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'preparer' 
        AND enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'users_roles_enum'
        )
      );
    `);

    if (!enumExists[0]?.exists) {
      // PostgreSQL no soporta IF NOT EXISTS en ADD VALUE, así que usamos un bloque DO
      await queryRunner.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'preparer' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_roles_enum')
          ) THEN
            ALTER TYPE "public"."users_roles_enum" ADD VALUE 'preparer';
          END IF;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Nota: PostgreSQL no permite eliminar valores de un enum directamente
    // Para revertir esto, necesitarías recrear el enum sin 'preparer'
    // Esto es complejo y puede requerir recrear todas las tablas que usan el enum
    // Por ahora, dejamos un comentario indicando que la reversión no es trivial
    console.warn('⚠️  Reverting this migration requires recreating the enum type, which is complex.');
    console.warn('⚠️  This operation is not automatically reversible.');
  }
}

