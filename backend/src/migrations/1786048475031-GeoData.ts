import { MigrationInterface, QueryRunner } from "typeorm";

export class GeoData1786048475031 implements MigrationInterface {
    name = 'GeoData1786048475031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "countries" ("id" integer NOT NULL, "code" character varying, "name" character varying NOT NULL, "phoneCode" character varying, CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "regions" ("id" integer NOT NULL, "countryId" integer NOT NULL, "code" character varying, "name" character varying NOT NULL, CONSTRAINT "PK_4fcd12ed6a046276e2deb08801c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "municipalities" ("id" integer NOT NULL, "regionId" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_9c4573349577306f221dda4d924" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "regions" ADD CONSTRAINT "FK_449a1b5dc2cb097bb2783f60cde" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "municipalities" ADD CONSTRAINT "FK_72f00bbc04a4dca8c5dbfbb9100" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "municipalities" DROP CONSTRAINT "FK_72f00bbc04a4dca8c5dbfbb9100"`);
        await queryRunner.query(`ALTER TABLE "regions" DROP CONSTRAINT "FK_449a1b5dc2cb097bb2783f60cde"`);
        await queryRunner.query(`DROP TABLE "municipalities"`);
        await queryRunner.query(`DROP TABLE "regions"`);
        await queryRunner.query(`DROP TABLE "countries"`);
    }

}
