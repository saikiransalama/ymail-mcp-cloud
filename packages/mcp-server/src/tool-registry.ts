import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MailProvider } from "@ymail-mcp/mailbox-core";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import type { DbClient } from "@ymail-mcp/db";
import type { Logger } from "@ymail-mcp/observability";
import type { Redis } from "ioredis";
import { withAuditLog } from "./middleware/audit.js";
import { checkRateLimit } from "./middleware/rate-limit.js";
import { registerListFolders } from "./tools/list-folders.js";
import { registerListMessages } from "./tools/list-messages.js";
import { registerSearchMessages } from "./tools/search-messages.js";
import { registerReadMessage } from "./tools/read-message.js";
import { registerSendMessage } from "./tools/send-message.js";
import { registerMarkRead } from "./tools/mark-read.js";
import { registerMarkUnread } from "./tools/mark-unread.js";
import { registerArchiveMessage } from "./tools/archive-message.js";

export interface ToolRegistryDeps {
  db: DbClient;
  redis: Redis;
  logger: Logger;
  requestId: string;
}

/**
 * Wraps a getContext factory so every tool invocation:
 * 1. Checks rate limits (per user, per tool)
 * 2. Writes an audit log entry
 *
 * Because each tool calls getContext() from inside its handler, wrapping
 * getContext is the correct place to enforce these cross-cutting concerns.
 */
function wrapGetContext(
  toolName: string,
  getContext: () => Promise<UserContext>,
  deps: ToolRegistryDeps
): () => Promise<UserContext> {
  return async () => {
    const ctx = await getContext();

    // Enforce per-user, per-tool rate limit
    await checkRateLimit(deps.redis, ctx.userId, toolName);

    // Wrap the remainder of the invocation in an audit log.
    // We return ctx here and let the tool handler call us from inside a
    // withAuditLog shell — but since the tool handlers call getContext()
    // at the top level and then do their work directly, we fire the audit
    // log as a side-effect after successfully passing rate limit.
    // The audit log for this invocation is written by calling withAuditLog
    // on a no-op so we capture timing from the getContext call onward.
    // NOTE: Tools that want accurate per-tool duration should be migrated
    // to a handler-wrapper pattern; this fires audit immediately after
    // context resolution to keep the change minimal and safe.
    withAuditLog(
      {
        toolName,
        userId: ctx.userId,
        connectionId: ctx.connectionId,
        requestId: deps.requestId,
        db: deps.db,
        logger: deps.logger,
      },
      async () => ctx
    ).catch(() => {
      // withAuditLog itself is fire-and-forget for audit writes;
      // we suppress any promise rejection here to avoid unhandled rejections.
    });

    return ctx;
  };
}

/**
 * Register all MCP tools on the server.
 *
 * getProvider() and getContext() are called per tool invocation —
 * they may resolve user context lazily from AsyncLocalStorage or
 * via a closure set before each request.
 *
 * Each tool's getContext is wrapped with checkRateLimit and withAuditLog.
 */
export function registerAllTools(
  server: McpServer,
  getProvider: () => MailProvider,
  getContext: () => Promise<UserContext>,
  deps: ToolRegistryDeps
): void {
  const toolRegistrations: Array<{
    name: string;
    register: (
      server: McpServer,
      getProvider: () => MailProvider,
      getContext: () => Promise<UserContext>
    ) => void;
  }> = [
    { name: "list_folders", register: registerListFolders },
    { name: "list_messages", register: registerListMessages },
    { name: "search_messages", register: registerSearchMessages },
    { name: "read_message", register: registerReadMessage },
    { name: "send_message", register: registerSendMessage },
    { name: "mark_read", register: registerMarkRead },
    { name: "mark_unread", register: registerMarkUnread },
    { name: "archive_message", register: registerArchiveMessage },
  ];

  for (const { name, register } of toolRegistrations) {
    const wrappedGetContext = wrapGetContext(name, getContext, deps);
    register(server, getProvider, wrappedGetContext);
  }
}
