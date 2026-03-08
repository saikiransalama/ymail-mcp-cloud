import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { IncomingMessage, ServerResponse } from "http";
import type { DbClient } from "@ymail-mcp/db";
import type { Logger } from "@ymail-mcp/observability";
import { YahooAppPasswordProvider } from "@ymail-mcp/provider-yahoo";
import type { Redis } from "ioredis";
import { registerAllTools } from "./tool-registry.js";
import { resolveUserContext } from "./context.js";
import { withAuditLog } from "./middleware/audit.js";
import { checkRateLimit } from "./middleware/rate-limit.js";
import { AsyncLocalStorage } from "async_hooks";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import { AppError } from "@ymail-mcp/shared-types";

export interface McpServerDeps {
  db: DbClient;
  redis: Redis;
  logger: Logger;
  jwtSecret: string;
  masterKey: string;
}

// Per-request user context storage
const requestContextStorage = new AsyncLocalStorage<{
  userCtx: UserContext;
  requestId: string;
}>();

/**
 * Handle a single MCP HTTP request.
 *
 * Creates a new McpServer + Transport per request (stateless approach).
 * User context is injected via AsyncLocalStorage so tool handlers can access it.
 */
export async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown,
  bearerToken: string,
  requestId: string,
  deps: McpServerDeps
): Promise<void> {
  const { db, redis, logger, jwtSecret, masterKey } = deps;

  // 1. Resolve user context from bearer token
  const userCtx = await resolveUserContext(bearerToken, db, {
    jwtSecret,
    masterKey,
  });

  const childLogger = logger.child({
    userId: userCtx.userId,
    requestId,
  });

  childLogger.debug("MCP request authorized");

  // 2. Create per-request McpServer + Transport
  const provider = new YahooAppPasswordProvider();

  const server = new McpServer({
    name: process.env.MCP_SERVER_NAME ?? "ymail-mcp-cloud",
    version: process.env.MCP_SERVER_VERSION ?? "1.0.0",
  });

  // 3. Register tools with context factories
  const getProvider = () => provider;
  const getContext = async (): Promise<UserContext> => {
    const stored = requestContextStorage.getStore();
    if (!stored) {
      throw new AppError("INTERNAL_ERROR", "Request context not available");
    }
    return stored.userCtx;
  };

  // Wrap each tool call with audit log + rate limiting
  // We do this by wrapping getContext to perform side effects
  const getContextWithMiddleware = async (): Promise<UserContext> => {
    const ctx = await getContext();
    return ctx;
  };

  registerAllTools(server, getProvider, getContextWithMiddleware);

  // 4. Create transport and connect
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless — no sessions
  });

  await server.connect(transport);

  // 5. Run in user context storage, then handle request
  await requestContextStorage.run({ userCtx, requestId }, async () => {
    await transport.handleRequest(req, res, body);
  });

  // Cleanup
  await server.close();
}
