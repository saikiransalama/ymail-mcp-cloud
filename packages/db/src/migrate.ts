#!/usr/bin/env tsx
/**
 * Database migration runner.
 * Called via: pnpm migrate
 * Also called automatically on API startup before server.listen()
 */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("Running database migrations...");

  const connection = postgres(databaseUrl, { max: 1 });
  const db = drizzle(connection);

  try {
    await migrate(db, {
      migrationsFolder: join(__dirname, "migrations"),
    });
    console.log("Migrations completed successfully");
  } finally {
    await connection.end();
  }
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
