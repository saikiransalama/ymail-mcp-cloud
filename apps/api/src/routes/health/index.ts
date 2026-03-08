import type { FastifyInstance } from "fastify";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { sql } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "../../../../package.json"), "utf8")
    );
    return pkg.version ?? "1.0.0";
  } catch {
    return "1.0.0";
  }
}

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_req, reply) => {
    const checks: Record<string, string> = {};

    // Check DB
    try {
      await app.db.execute(sql`SELECT 1`);
      checks.db = "ok";
    } catch {
      checks.db = "error";
    }

    // Check Redis
    try {
      await app.redis.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
    }

    const allOk = Object.values(checks).every((v) => v === "ok");

    return reply.status(allOk ? 200 : 503).send({
      status: allOk ? "ok" : "degraded",
      version: getVersion(),
      timestamp: new Date().toISOString(),
      checks,
    });
  });
}
