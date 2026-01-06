import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemConfig1736100000000 implements MigrationInterface {
  name = 'AddSystemConfig1736100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla system_config
    await queryRunner.query(`
      CREATE TABLE "system_config" (
        "key" character varying(100) NOT NULL,
        "value" text NOT NULL,
        "description" character varying(500),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_config" PRIMARY KEY ("key")
      )
    `);

    // Insertar configuración inicial con login habilitado
    await queryRunner.query(`
      INSERT INTO "system_config" ("key", "value", "description", "updated_at")
      VALUES ('login_enabled', 'true', 'Habilita o deshabilita el login en el sistema', NOW())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "system_config"`);
  }
}

