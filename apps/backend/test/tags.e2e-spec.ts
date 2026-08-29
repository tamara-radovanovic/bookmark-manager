import "dotenv/config";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AuthModule } from "../src/auth/auth.module";
import { TagsModule } from "../src/tags/tags.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { buildValidationExceptionFactory } from "../src/common/pipes/validation-exception-factory";
import { buildTestDatabaseUrl, ensureTestDatabaseExists } from "./test-db.util";

describe("Tags (e2e)", () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const testDatabaseUrl = buildTestDatabaseUrl();
    await ensureTestDatabaseExists(testDatabaseUrl);

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: "postgres",
          url: testDatabaseUrl,
          autoLoadEntities: true,
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
        TagsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: buildValidationExceptionFactory(),
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.use(cookieParser());
    await app.init();

    const suffix = Date.now();
    const registerA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: `tag-a-${suffix}@example.com`, password: "lozinka123" });
    tokenA = (registerA.body as { access_token: string }).access_token;

    const registerB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: `tag-b-${suffix}@example.com`, password: "lozinka123" });
    tokenB = (registerB.body as { access_token: string }).access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /tags", () => {
    it("creates a tag owned by the authenticated user", async () => {
      const response = await request(app.getHttpServer())
        .post("/tags")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "react" })
        .expect(201);

      expect(response.body).toMatchObject({ name: "react" });
    });

    it("never leaks user_id — only { id, name }", async () => {
      const response = await request(app.getHttpServer())
        .post("/tags")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "shape-check" })
        .expect(201);

      expect(response.body).toEqual({ id: expect.any(String), name: "shape-check" });
    });

    it("rejects a duplicate name for the same user with 409", async () => {
      const response = await request(app.getHttpServer())
        .post("/tags")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "react" })
        .expect(409);

      expect(response.body).toEqual({ error_code: "TAG_ALREADY_EXISTS" });
    });

    it("allows the same name for a different user", async () => {
      await request(app.getHttpServer())
        .post("/tags")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ name: "react" })
        .expect(201);
    });

    it("rejects requests with no access token with 401", async () => {
      await request(app.getHttpServer()).post("/tags").send({ name: "react" }).expect(401);
    });
  });

  describe("GET /tags", () => {
    it("only returns the requesting user's tags, never another user's", async () => {
      await request(app.getHttpServer())
        .post("/tags")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ name: "b-only-tag" })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get("/tags")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);

      const names = response.body.map((t: { name: string }) => t.name);
      expect(names).toContain("react");
      expect(names).not.toContain("b-only-tag");
    });
  });

  describe("DELETE /tags/:id", () => {
    it("returns 404 (not 403) when another user tries to delete it", async () => {
      const created = await request(app.getHttpServer())
        .post("/tags")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "to-delete" });
      const tagId = (created.body as { id: string }).id;

      const response = await request(app.getHttpServer())
        .delete(`/tags/${tagId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .expect(404);
      expect(response.body).toEqual({ error_code: "TAG_NOT_FOUND" });

      await request(app.getHttpServer())
        .delete(`/tags/${tagId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(204);
    });
  });
});
