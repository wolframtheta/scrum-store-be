import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomizationOptions1769080326265 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add customization_options column to articles table
        await queryRunner.query(`
            ALTER TABLE "articles" 
            ADD COLUMN "customization_options" jsonb DEFAULT NULL
        `);

        // Add selected_options column to order_items table
        await queryRunner.query(`
            ALTER TABLE "order_items" 
            ADD COLUMN "selected_options" jsonb DEFAULT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove selected_options column from order_items table
        await queryRunner.query(`
            ALTER TABLE "order_items" 
            DROP COLUMN "selected_options"
        `);

        // Remove customization_options column from articles table
        await queryRunner.query(`
            ALTER TABLE "articles" 
            DROP COLUMN "customization_options"
        `);
    }

}
