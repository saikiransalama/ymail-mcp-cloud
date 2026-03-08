import { Worker, type Job } from "bullmq";
import type { DbClient } from "@ymail-mcp/db";
import { listAllActiveConnections, updateConnectionStatus } from "@ymail-mcp/db";
import { decryptSecret } from "@ymail-mcp/security";
import { pingImapConnection } from "@ymail-mcp/provider-yahoo";
import type { Logger } from "@ymail-mcp/observability";
import { QUEUE_NAMES, type ConnectionHealthJobData } from "../queues/definitions.js";

export function createConnectionHealthWorker(
  redisUrl: string,
  db: DbClient,
  masterKey: string,
  logger: Logger
): Worker {
  const worker = new Worker<ConnectionHealthJobData>(
    QUEUE_NAMES.CONNECTION_HEALTH,
    async (_job: Job<ConnectionHealthJobData>) => {
      // Process all active connections
      const connections = await listAllActiveConnections(db);
      logger.info({ count: connections.length }, "Running connection health checks");

      for (const connection of connections) {
        try {
          const plaintext = decryptSecret(
            {
              blob: connection.encryptedSecretBlob,
              iv: connection.iv,
              authTag: connection.authTag,
            },
            masterKey
          );

          const credentials = JSON.parse(plaintext) as {
            email: string;
            appPassword: string;
          };

          const isAlive = await pingImapConnection(connection.userId, credentials);

          if (isAlive) {
            logger.debug(
              { connectionId: connection.id, userId: connection.userId },
              "Connection health OK"
            );
          } else {
            await updateConnectionStatus(db, connection.id, "error");
            logger.warn(
              { connectionId: connection.id, userId: connection.userId },
              "Connection health check failed — marked as error"
            );
          }
        } catch (err) {
          logger.error(
            { err, connectionId: connection.id },
            "Failed to check connection health"
          );
          await updateConnectionStatus(db, connection.id, "error").catch(() => {});
        }
      }
    },
    {
      connection: { url: redisUrl },
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    logger.error({ err, jobId: job?.id }, "Connection health job failed");
  });

  return worker;
}
