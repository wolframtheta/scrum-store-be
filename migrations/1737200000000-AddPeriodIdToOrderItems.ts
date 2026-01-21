import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPeriodIdToOrderItems1737200000000 implements MigrationInterface {
  name = 'AddPeriodIdToOrderItems1737200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Afegir columna period_id a order_items
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD COLUMN IF NOT EXISTS "period_id" uuid;
    `);

    // Afegir foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD CONSTRAINT "FK_order_items_period_id"
      FOREIGN KEY ("period_id")
      REFERENCES "periods"("id")
      ON DELETE SET NULL;
    `);

    // Afegir índex per millorar les consultes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_order_items_period_id"
      ON "order_items"("period_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índex
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_order_items_period_id";
    `);

    // Eliminar foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "order_items"
      DROP CONSTRAINT IF EXISTS "FK_order_items_period_id";
    `);

    // Eliminar columna
    await queryRunner.query(`
      ALTER TABLE "order_items"
      DROP COLUMN IF EXISTS "period_id";
    `);
  }
}

