import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleUpdatedAt1763132944542 implements MigrationInterface {
  name = 'AddUserRoleUpdatedAt1763132944542';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_roles"
      ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_roles"
      DROP COLUMN IF EXISTS "updated_at"
    `);
  }
}
