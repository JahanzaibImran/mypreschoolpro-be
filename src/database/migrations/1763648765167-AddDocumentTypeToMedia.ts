import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentTypeToMedia1763648765167 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing check constraint
        await queryRunner.query(`
            ALTER TABLE "media" 
            DROP CONSTRAINT IF EXISTS "media_file_type_check"
        `);

        // Add the new check constraint with 'document' included
        await queryRunner.query(`
            ALTER TABLE "media" 
            ADD CONSTRAINT "media_file_type_check" 
            CHECK (file_type IN ('image', 'video', 'document'))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the constraint with 'document'
        await queryRunner.query(`
            ALTER TABLE "media" 
            DROP CONSTRAINT IF EXISTS "media_file_type_check"
        `);

        // Restore the original constraint (only image and video)
        await queryRunner.query(`
            ALTER TABLE "media" 
            ADD CONSTRAINT "media_file_type_check" 
            CHECK (file_type IN ('image', 'video'))
        `);
    }

}
