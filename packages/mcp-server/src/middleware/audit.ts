import type { DbClient } from "@ymail-mcp/db";
import { insertAuditLog } from "@ymail-mcp/db";
import type { Logger } from "@ymail-mcp/observability";
import { isAppError } from "@ymail-mcp/shared-types";

/**
 * Wraps a tool handler function with audit logging.
 * Records: tool name, user, connection, status, error code, duration.
 * NEVER records message bodies or credentials.
 */
export async function withAuditLog<T>(
  opts: {
    toolName: string;
    userId: string;
    connectionId: string | undefined;
    requestId: string;
    db: DbClient;
    logger: Logger;
  },
  fn: () => Promise<T>
): Promise<T> {
  const { toolName, userId, connectionId, requestId, db, logger } = opts;
  const startTime = Date.now();

  try {
    const result = await fn();
    const durationMs = Date.now() - startTime;

    // Fire-and-forget audit log (don't let audit failure break the tool call)
    insertAuditLog(db, {
      userId,
      connectionId,
      toolName,
      requestId,
      status: "ok",
      durationMs,
    }).catch((err) => {
      logger.error({ err, toolName, userId }, "Failed to write audit log");
    });

    return result;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorCode = isAppError(err) ? err.code : "INTERNAL_ERROR";

    // Fire-and-forget audit log
    insertAuditLog(db, {
      userId,
      connectionId,
      toolName,
      requestId,
      status: "error",
      errorCode,
      durationMs,
    }).catch((auditErr) => {
      logger.error({ auditErr, toolName, userId }, "Failed to write error audit log");
    });

    throw err;
  }
}
