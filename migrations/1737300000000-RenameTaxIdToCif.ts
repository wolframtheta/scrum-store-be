import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTaxIdToCif1737300000000 implements MigrationInterface {
  name = 'RenameTaxIdToCif1737300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Renombrar columna tax_id a cif en la tabla suppliers
    await queryRunner.query(`
      ALTER TABLE "suppliers"
      RENAME COLUMN "tax_id" TO "cif";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir: renombrar columna cif a tax_id
    await queryRunner.query(`
      ALTER TABLE "suppliers"
      RENAME COLUMN "cif" TO "tax_id";
    `);
  }
}
