import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTags1788037567158 implements MigrationInterface {
  name = "CreateTags1788037567158";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "UQ_1d8718578ce96a09d1aa2237a14" UNIQUE ("name", "user_id"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bookmark_tags" ("bookmark_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_2d558ecda3abcfa41b8152f689a" PRIMARY KEY ("bookmark_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fab2760408a0e460cacc6cbdac" ON "bookmark_tags" ("bookmark_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6dbf982610ba36aeb391e1fead" ON "bookmark_tags" ("tag_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "FK_74603743868d1e4f4fc2c0225b6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark_tags" ADD CONSTRAINT "FK_fab2760408a0e460cacc6cbdacc" FOREIGN KEY ("bookmark_id") REFERENCES "bookmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark_tags" ADD CONSTRAINT "FK_6dbf982610ba36aeb391e1fead5" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookmark_tags" DROP CONSTRAINT "FK_6dbf982610ba36aeb391e1fead5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookmark_tags" DROP CONSTRAINT "FK_fab2760408a0e460cacc6cbdacc"`,
    );
    await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_74603743868d1e4f4fc2c0225b6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6dbf982610ba36aeb391e1fead"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fab2760408a0e460cacc6cbdac"`);
    await queryRunner.query(`DROP TABLE "bookmark_tags"`);
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
