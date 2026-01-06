import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreparerRole1736080000000 implements MigrationInterface {
  name = 'AddPreparerRole1736080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Afegir el camp is_preparer a user_consumer_groups
    await queryRunner.query(`
      ALTER TABLE "user_consumer_groups" 
      ADD COLUMN IF NOT EXISTS "is_preparer" boolean NOT NULL DEFAULT false;
    `);

    // Afegir el camp is_preparer a group_invitations
    await queryRunner.query(`
      ALTER TABLE "group_invitations" 
      ADD COLUMN IF NOT EXISTS "is_preparer" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar el camp is_preparer de group_invitations
    await queryRunner.query(`
      ALTER TABLE "group_invitations" 
      DROP COLUMN IF EXISTS "is_preparer";
    `);

    // Eliminar el camp is_preparer de user_consumer_groups
    await queryRunner.query(`
      ALTER TABLE "user_consumer_groups" 
      DROP COLUMN IF EXISTS "is_preparer";
    `);
  }
}

