import { Queue } from "bullmq";
import { QUEUE_NAMES } from "./queues/definitions.js";
import type { Logger } from "@ymail-mcp/observability";

export async function startScheduler(
  redisUrl: string,
  logger: Logger
): Promise<void> {
  const healthQueue = new Queue(QUEUE_NAMES.CONNECTION_HEALTH, {
    connection: { url: redisUrl },
  });

  // Schedule connection health check every 15 minutes
  await healthQueue.add(
    "health-check",
    {},
    {
      repeat: {
        pattern: "*/15 * * * *", // Every 15 minutes
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );

  logger.info("Scheduler started: connection health check every 15 minutes");
}
