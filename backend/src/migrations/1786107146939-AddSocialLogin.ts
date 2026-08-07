import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSocialLogin1786107146939 implements MigrationInterface {
    name = 'AddSocialLogin1786107146939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "socialProvider" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "socialId" character varying(190)`);
        await queryRunner.query(`ALTER TABLE "people" DROP CONSTRAINT "FK_c012be60ab404219b6957d99eb3"`);
        await queryRunner.query(`ALTER TABLE "people" ALTER COLUMN "birdthDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" ALTER COLUMN "dni" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" ALTER COLUMN "residencia" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" ALTER COLUMN "telefono" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" ALTER COLUMN "typeDniId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" ADD CONSTRAINT "FK_c012be60ab404219b6957d99eb3" FOREIGN KEY ("typeDniId") REFERENCES "type_dni"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "people" DROP CONSTRAINT "FK_c012be60ab404219b6957d99eb3"`);
        await queryRunner.query(`ALTER TABLE "people" ALTER COLUMN "typeDniId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" ALTER COLUMN "telefono" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" ALTER COLUMN "residencia" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" ALTER COLUMN "dni" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" ALTER COLUMN "birdthDate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "people" ADD CONSTRAINT "FK_c012be60ab404219b6957d99eb3" FOREIGN KEY ("typeDniId") REFERENCES "type_dni"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "socialId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "socialProvider"`);
    }

}
