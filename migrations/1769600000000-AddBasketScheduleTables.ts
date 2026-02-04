import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBasketScheduleTables1769600000000 implements MigrationInterface {
  name = 'AddBasketScheduleTables1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "basket_schedule_config" (
        "consumer_group_id" uuid NOT NULL,
        "preferred_weekday" smallint,
        "preferred_time" varchar(20),
        CONSTRAINT "PK_basket_schedule_config" PRIMARY KEY ("consumer_group_id"),
        CONSTRAINT "FK_basket_schedule_config_consumer_group" FOREIGN KEY ("consumer_group_id") REFERENCES "consumer_groups"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "basket_schedule_votes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "consumer_group_id" uuid NOT NULL,
        "user_email" varchar(255) NOT NULL,
        "date" date NOT NULL,
        "status" varchar(20) NOT NULL,
        CONSTRAINT "PK_basket_schedule_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_basket_schedule_votes_group_user_date" UNIQUE ("consumer_group_id", "user_email", "date"),
        CONSTRAINT "FK_basket_schedule_votes_consumer_group" FOREIGN KEY ("consumer_group_id") REFERENCES "consumer_groups"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "basket_schedule_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "consumer_group_id" uuid NOT NULL,
        "date" date NOT NULL,
        "assigned_user_email" varchar(255) NOT NULL,
        CONSTRAINT "PK_basket_schedule_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_basket_schedule_assignments_group_date" UNIQUE ("consumer_group_id", "date"),
        CONSTRAINT "FK_basket_schedule_assignments_consumer_group" FOREIGN KEY ("consumer_group_id") REFERENCES "consumer_groups"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "basket_schedule_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "basket_schedule_votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "basket_schedule_config"`);
  }
}
