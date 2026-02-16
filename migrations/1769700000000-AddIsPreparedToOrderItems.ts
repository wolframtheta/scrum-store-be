import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsPreparedToOrderItems1769700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'order_items',
      new TableColumn({
        name: 'is_prepared',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    // Crear índex per millorar el rendiment de consultes per items preparats
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_is_prepared" ON "order_items" ("is_prepared")`,
    );

    // Crear índex compost per period_id i is_prepared per a la preparació de cistelles
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_period_prepared" ON "order_items" ("period_id", "is_prepared")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_order_items_period_prepared"`);
    await queryRunner.query(`DROP INDEX "IDX_order_items_is_prepared"`);
    await queryRunner.dropColumn('order_items', 'is_prepared');
  }
}
