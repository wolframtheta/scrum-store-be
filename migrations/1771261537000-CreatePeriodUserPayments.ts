import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreatePeriodUserPayments1771261537000 implements MigrationInterface {
    name = 'CreatePeriodUserPayments1771261537000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create period_user_payments table
        await queryRunner.createTable(
            new Table({
                name: "period_user_payments",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "period_id",
                        type: "uuid",
                        isNullable: false,
                    },
                    {
                        name: "user_id",
                        type: "uuid",
                        isNullable: false,
                    },
                    {
                        name: "consumer_group_id",
                        type: "uuid",
                        isNullable: false,
                    },
                    {
                        name: "payment_status",
                        type: "enum",
                        enum: ["unpaid", "paid"],
                        default: "'unpaid'",
                    },
                    {
                        name: "total_amount",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: "notes",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        // Add unique constraint
        await queryRunner.createIndex(
            "period_user_payments",
            new TableIndex({
                name: "UQ_period_user_group",
                columnNames: ["period_id", "user_id", "consumer_group_id"],
                isUnique: true,
            })
        );

        // Add composite index for queries
        await queryRunner.createIndex(
            "period_user_payments",
            new TableIndex({
                name: "IDX_period_user_payments_period_user_group",
                columnNames: ["period_id", "user_id", "consumer_group_id"],
            })
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            "period_user_payments",
            new TableForeignKey({
                name: "FK_period_user_payments_period",
                columnNames: ["period_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "periods",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "period_user_payments",
            new TableForeignKey({
                name: "FK_period_user_payments_user",
                columnNames: ["user_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "period_user_payments",
            new TableForeignKey({
                name: "FK_period_user_payments_group",
                columnNames: ["consumer_group_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "consumer_groups",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.dropForeignKey("period_user_payments", "FK_period_user_payments_group");
        await queryRunner.dropForeignKey("period_user_payments", "FK_period_user_payments_user");
        await queryRunner.dropForeignKey("period_user_payments", "FK_period_user_payments_period");

        // Drop indexes
        await queryRunner.dropIndex("period_user_payments", "IDX_period_user_payments_period_user_group");
        await queryRunner.dropIndex("period_user_payments", "UQ_period_user_group");

        // Drop table
        await queryRunner.dropTable("period_user_payments");
    }
}
