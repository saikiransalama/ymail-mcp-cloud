import "dotenv/config";
import { z } from "zod";
import { createDbClient } from "@ymail-mcp/db";
import { createLogger } from "@ymail-mcp/observability";
import { createConnectionHealthWorker } from "./workers/connection-health.js";
import { startScheduler } from "./scheduler.js";
import { shutdownImapPool } from "@ymail-mcp/provider-yahoo";

const configSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  MASTER_KEY: z.string().length(64),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

async function main() {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid worker configuration:", result.error.errors);
    process.exit(1);
  }

  const config = result.data;
  const logger = createLogger("worker", config.LOG_LEVEL);

  logger.info("Starting YMail MCP Cloud Worker");

  const db = createDbClient(config.DATABASE_URL);

  // Start workers — BullMQ manages its own Redis connection via URL
  const healthWorker = createConnectionHealthWorker(
    config.REDIS_URL,
    db,
    config.MASTER_KEY,
    logger
  );

  // Start scheduler
  await startScheduler(config.REDIS_URL, logger);

  logger.info("Worker running. Press Ctrl+C to stop.");

  const shutdown = async () => {
    logger.info("Shutting down worker...");
    await healthWorker.close();
    await shutdownImapPool();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
