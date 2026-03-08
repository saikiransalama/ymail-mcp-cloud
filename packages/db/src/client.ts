import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export type DbClient = ReturnType<typeof createDbClient>;

export function createDbClient(databaseUrl: string): ReturnType<typeof drizzle<typeof schema>> {
  const connection = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  });

  return drizzle(connection, { schema });
}

// Singleton for apps that use a single connection
let _db: ReturnType<typeof createDbClient> | null = null;

export function getDb(databaseUrl?: string): ReturnType<typeof createDbClient> {
  if (!_db) {
    const url = databaseUrl ?? process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is required");
    }
    _db = createDbClient(url);
  }
  return _db;
}
