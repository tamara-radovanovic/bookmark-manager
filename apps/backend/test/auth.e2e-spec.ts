import "dotenv/config";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import cookieParser from "cookie-parser";
import request from "supertest";
import { Client } from "pg";
import { AuthModule } from "../src/auth/auth.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";

/**
 * Runs the real HTTP layer (controllers, pipes, filters, guards) against a
 * throwaway Postgres database on the same local Postgres instance used for
 * dev — same credentials/host/port as DATABASE_URL, different database name.
 * Uses synchronize+dropSchema (never done outside tests) so each run starts
 * from a clean, migration-free schema without needing to run migrations here.
 */
function buildTestDatabaseUrl(): string {
  const baseUrl = new URL(process.env.DATABASE_URL ?? "");
  baseUrl.pathname = "/bookmark_manager_test";
  return baseUrl.toString();
}

async function ensureTestDatabaseExists(testDatabaseUrl: string): Promise<void> {
  const testDbName = new URL(testDatabaseUrl).pathname.slice(1);
  const maintenanceUrl = new URL(testDatabaseUrl);
  maintenanceUrl.pathname = "/postgres";

  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();
  const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
    testDbName,
  ]);
  if (rowCount === 0) {
    await client.query(`CREATE DATABASE "${testDbName}"`);
  }
  await client.end();
}

describe("Auth (e2e)", () => {
  let app: INestApplication;

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
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/register", () => {
    it("registers a new user, returns an access token, and sets the refresh cookie", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send({ email: "e2e@example.com", password: "lozinka123" })
        .expect(201);

      expect(response.body).toEqual({ access_token: expect.any(String) });

      const cookie = response.headers["set-cookie"][0] as string;
      expect(cookie).toContain("refresh_token=");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Strict");
    });

    it("rejects a duplicate email with 409 AUTH_EMAIL_ALREADY_EXISTS", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send({ email: "e2e@example.com", password: "lozinka123" })
        .expect(409);

      expect(response.body).toEqual({ error_code: "AUTH_EMAIL_ALREADY_EXISTS" });
    });

    it("rejects an invalid email with 400", async () => {
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({ email: "not-an-email", password: "lozinka123" })
        .expect(400);
    });

    it("rejects a password shorter than 8 characters with 400", async () => {
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({ email: "shortpw@example.com", password: "short" })
        .expect(400);
    });

    it("rejects unexpected extra fields with 400 (whitelist)", async () => {
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({ email: "extra@example.com", password: "lozinka123", isAdmin: true })
        .expect(400);
    });
  });

  describe("POST /auth/login", () => {
    it("logs in with correct credentials (200, not 201)", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "e2e@example.com", password: "lozinka123" })
        .expect(200);

      expect(response.body).toEqual({ access_token: expect.any(String) });
    });

    it("rejects a wrong password with 401 AUTH_INVALID_CREDENTIALS", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "e2e@example.com", password: "wrong-password" })
        .expect(401);

      expect(response.body).toEqual({ error_code: "AUTH_INVALID_CREDENTIALS" });
    });

    it("rejects a nonexistent email with the same 401 AUTH_INVALID_CREDENTIALS", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "doesnotexist@example.com", password: "whatever1" })
        .expect(401);

      expect(response.body).toEqual({ error_code: "AUTH_INVALID_CREDENTIALS" });
    });
  });

  describe("POST /auth/refresh", () => {
    it("issues a new token pair from a valid refresh cookie, then rotates it out", async () => {
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "e2e@example.com", password: "lozinka123" })
        .expect(200);
      const cookie = loginResponse.headers["set-cookie"][0] as string;

      const refreshResponse = await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", cookie)
        .expect(200);
      expect(refreshResponse.body).toEqual({ access_token: expect.any(String) });

      // Rotation: the same refresh cookie must not work a second time.
      const reuseResponse = await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", cookie)
        .expect(401);
      expect(reuseResponse.body).toEqual({ error_code: "AUTH_REFRESH_INVALID" });
    });

    it("rejects a missing refresh cookie with 401", async () => {
      const response = await request(app.getHttpServer()).post("/auth/refresh").expect(401);
      expect(response.body).toEqual({ error_code: "AUTH_REFRESH_INVALID" });
    });

    it("rejects a syntactically invalid refresh cookie with 401", async () => {
      await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", "refresh_token=not-a-real-token")
        .expect(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("rejects a request without an access token with 401", async () => {
      const response = await request(app.getHttpServer()).post("/auth/logout").expect(401);
      expect(response.body).toEqual({ error_code: "AUTH_UNAUTHORIZED" });
    });

    it("logs out with a valid access token, clears the cookie, and revokes the refresh token", async () => {
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "e2e@example.com", password: "lozinka123" })
        .expect(200);
      const accessToken = (loginResponse.body as { access_token: string }).access_token;
      const refreshCookie = loginResponse.headers["set-cookie"][0] as string;

      const logoutResponse = await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", refreshCookie)
        .expect(200);

      expect(logoutResponse.body).toEqual({ message: "Logged out successfully" });

      await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", refreshCookie)
        .expect(401);
    });
  });
});
