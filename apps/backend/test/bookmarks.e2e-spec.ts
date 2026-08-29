import "dotenv/config";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AuthModule } from "../src/auth/auth.module";
import { BookmarksModule } from "../src/bookmarks/bookmarks.module";
import { TagsModule } from "../src/tags/tags.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { buildValidationExceptionFactory } from "../src/common/pipes/validation-exception-factory";
import { buildTestDatabaseUrl, ensureTestDatabaseExists } from "./test-db.util";

describe("Bookmarks (e2e)", () => {
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
        BookmarksModule,
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
      .send({ email: `bm-a-${suffix}@example.com`, password: "lozinka123" });
    tokenA = (registerA.body as { access_token: string }).access_token;

    const registerB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: `bm-b-${suffix}@example.com`, password: "lozinka123" });
    tokenB = (registerB.body as { access_token: string }).access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /bookmarks", () => {
    it("creates a bookmark owned by the authenticated user", async () => {
      const response = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "https://example.com", title: "Example" })
        .expect(201);

      expect(response.body).toMatchObject({ url: "https://example.com", title: "Example" });
      expect(response.body.id).toEqual(expect.any(String));
    });

    it("never leaks user_id or raw Date objects — only the documented public shape", async () => {
      const response = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "https://shape-check.example.com", title: "Shape check" })
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        url: "https://shape-check.example.com",
        title: "Shape check",
        description: null,
        favicon_url: null,
        tags: [],
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it("rejects a malformed URL with 400 VALIDATION_FAILED", async () => {
      const response = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "not-a-url", title: "Example" })
        .expect(400);

      expect(response.body).toEqual({ error_code: "VALIDATION_FAILED", fields: ["url"] });
    });

    it("rejects an empty title with 400 VALIDATION_FAILED", async () => {
      const response = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "https://example.com", title: "" })
        .expect(400);

      expect(response.body.fields).toContain("title");
    });

    it("rejects requests with no access token with 401", async () => {
      await request(app.getHttpServer())
        .post("/bookmarks")
        .send({ url: "https://example.com", title: "Example" })
        .expect(401);
    });
  });

  describe("ownership across GET/PATCH/DELETE", () => {
    let bookmarkId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "https://owned-by-a.example.com", title: "Owned by A" });
      bookmarkId = (response.body as { id: string }).id;
    });

    it("lets the owner read it", async () => {
      await request(app.getHttpServer())
        .get(`/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);
    });

    it("returns 404 (not 403) for another user reading it", async () => {
      const response = await request(app.getHttpServer())
        .get(`/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .expect(404);

      expect(response.body).toEqual({ error_code: "BOOKMARK_NOT_FOUND" });
    });

    it("returns 404 for another user updating it, and doesn't change it", async () => {
      await request(app.getHttpServer())
        .patch(`/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ title: "Hijacked" })
        .expect(404);

      const stillOwnedByA = await request(app.getHttpServer())
        .get(`/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);
      expect(stillOwnedByA.body.title).toBe("Owned by A");
    });

    it("returns 404 for another user deleting it, and it still exists", async () => {
      await request(app.getHttpServer())
        .delete(`/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);
    });

    it("returns 404 for a bookmark id that never existed at all", async () => {
      await request(app.getHttpServer())
        .get("/bookmarks/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(404);
    });
  });

  describe("GET /bookmarks search", () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "https://react.dev", title: "React docs" });
    });

    it("matches on title", async () => {
      const response = await request(app.getHttpServer())
        .get("/bookmarks?search=react")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body.some((b: { title: string }) => b.title === "React docs")).toBe(true);
    });

    it("only returns the requesting user's bookmarks, never another user's", async () => {
      const response = await request(app.getHttpServer())
        .get("/bookmarks")
        .set("Authorization", `Bearer ${tokenB}`)
        .expect(200);

      expect(response.body.some((b: { title: string }) => b.title === "React docs")).toBe(false);
    });
  });

  describe("PATCH /bookmarks/:id and DELETE /bookmarks/:id (owner)", () => {
    it("updates only the given fields", async () => {
      const created = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "https://before.example.com", title: "Before", description: "Keep me" });
      const id = (created.body as { id: string }).id;

      const patched = await request(app.getHttpServer())
        .patch(`/bookmarks/${id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ title: "After" })
        .expect(200);

      expect(patched.body).toMatchObject({
        title: "After",
        url: "https://before.example.com",
        description: "Keep me",
      });
    });

    it("deletes and returns 204, then 404 on subsequent reads", async () => {
      const created = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "https://delete-me.example.com", title: "Delete me" });
      const id = (created.body as { id: string }).id;

      await request(app.getHttpServer())
        .delete(`/bookmarks/${id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/bookmarks/${id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(404);
    });
  });

  describe("tags on bookmarks", () => {
    let reactTagId: string;
    let tutorialTagId: string;
    let othersTagId: string;

    beforeAll(async () => {
      const react = await request(app.getHttpServer())
        .post("/tags")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "react-e2e" });
      reactTagId = (react.body as { id: string }).id;

      const tutorial = await request(app.getHttpServer())
        .post("/tags")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "tutorial-e2e" });
      tutorialTagId = (tutorial.body as { id: string }).id;

      const othersTag = await request(app.getHttpServer())
        .post("/tags")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ name: "not-yours" });
      othersTagId = (othersTag.body as { id: string }).id;
    });

    it("attaches owned tags when creating a bookmark", async () => {
      const response = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          url: "https://react.dev",
          title: "React docs",
          tag_ids: [reactTagId, tutorialTagId],
        })
        .expect(201);

      expect(response.body.tags).toHaveLength(2);
    });

    it("rejects another user's tag_id with 400 INVALID_TAG_IDS, not a silent skip", async () => {
      const response = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "https://example.com", title: "x", tag_ids: [othersTagId] })
        .expect(400);

      expect(response.body).toEqual({ error_code: "INVALID_TAG_IDS" });
    });

    it("filters by tag name and keeps every tag on the matching bookmark", async () => {
      const response = await request(app.getHttpServer())
        .get("/bookmarks?tag=react-e2e")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].tags).toHaveLength(2);
    });

    it("PATCH tag_ids replaces the tag set", async () => {
      const created = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "https://patch-tags.example.com", title: "x", tag_ids: [reactTagId] });
      const id = (created.body as { id: string }).id;

      const patched = await request(app.getHttpServer())
        .patch(`/bookmarks/${id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ tag_ids: [tutorialTagId] })
        .expect(200);

      expect(patched.body.tags).toEqual([expect.objectContaining({ id: tutorialTagId })]);
    });

    it("deleting a tag detaches it from bookmarks without deleting them", async () => {
      const created = await request(app.getHttpServer())
        .post("/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ url: "https://cascade.example.com", title: "x", tag_ids: [reactTagId] });
      const id = (created.body as { id: string }).id;

      await request(app.getHttpServer())
        .delete(`/tags/${reactTagId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(204);

      const after = await request(app.getHttpServer())
        .get(`/bookmarks/${id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);
      expect(after.body.tags).toEqual([]);
    });
  });
});
