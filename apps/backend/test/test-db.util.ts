import { Client } from "pg";

/**
 * Points e2e tests at a throwaway Postgres database on the same local
 * instance used for dev — same credentials/host/port as DATABASE_URL,
 * different database name — so tests never touch real dev data.
 */
export function buildTestDatabaseUrl(): string {
  const baseUrl = new URL(process.env.DATABASE_URL ?? "");
  baseUrl.pathname = "/bookmark_manager_test";
  return baseUrl.toString();
}

export async function ensureTestDatabaseExists(testDatabaseUrl: string): Promise<void> {
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
