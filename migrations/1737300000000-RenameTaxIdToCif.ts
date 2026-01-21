import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTaxIdToCif1737300000000 implements MigrationInterface {
  name = 'RenameTaxIdToCif1737300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la columna tax_id existe antes de renombrarla
    const table = await queryRunner.getTable('suppliers');
    const taxIdColumn = table?.findColumnByName('tax_id');
    const cifColumn = table?.findColumnByName('cif');

    // Solo renombrar si tax_id existe y cif no existe
    if (taxIdColumn && !cifColumn) {
      await queryRunner.query(`
        ALTER TABLE "suppliers"
        RENAME COLUMN "tax_id" TO "cif";
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir: renombrar columna cif a tax_id solo si cif existe y tax_id no existe
    const table = await queryRunner.getTable('suppliers');
    const taxIdColumn = table?.findColumnByName('tax_id');
    const cifColumn = table?.findColumnByName('cif');

    if (cifColumn && !taxIdColumn) {
      await queryRunner.query(`
        ALTER TABLE "suppliers"
        RENAME COLUMN "cif" TO "tax_id";
      `);
    }
  }
}
