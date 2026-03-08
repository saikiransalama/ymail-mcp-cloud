import type { FastifyInstance } from "fastify";
import { extractBearerToken } from "@ymail-mcp/security";
import { handleMcpRequest } from "@ymail-mcp/mcp-server";
import { AppError } from "@ymail-mcp/shared-types";
import { randomUUID } from "crypto";

/**
 * MCP HTTP endpoint.
 *
 * This is the Fastify-to-MCP-SDK bridge. We hijack the Fastify reply
 * and pipe directly through to the MCP SDK's StreamableHTTPServerTransport,
 * which writes its own response to the underlying Node.js ServerResponse.
 *
 * Auth: Bearer token is required. The same JWT from /auth/login is used.
 * Per-request user context is resolved inside handleMcpRequest.
 */
export async function mcpRoutes(app: FastifyInstance): Promise<void> {
  // Handle GET (for SSE stream) and POST (for JSON-RPC) and DELETE (for session teardown)
  app.route({
    method: ["GET", "POST", "DELETE"],
    url: "/mcp",
    config: {
      // Disable Fastify's default body parsing for raw MCP handling
    },
    handler: async (req, reply) => {
      const requestId = randomUUID();

      // Extract bearer token
      const token = extractBearerToken(req.headers.authorization);
      if (!token) {
        return reply.status(401).send({
          error: "UNAUTHORIZED",
          message: "Missing Authorization: Bearer <token> header",
        });
      }

      // Hijack the reply — the MCP SDK writes directly to reply.raw
      reply.hijack();

      try {
        await handleMcpRequest(
          req.raw,
          reply.raw,
          req.body, // May be null for GET requests
          token,
          requestId,
          {
            db: app.db,
            redis: app.redis,
            logger: app.log as never,
            jwtSecret: app.config.JWT_SECRET,
            masterKey: app.config.MASTER_KEY,
          }
        );
      } catch (err) {
        // If the response hasn't been sent yet, send an error response
        if (!reply.raw.headersSent) {
          const statusCode =
            err instanceof AppError ? err.statusCode : 500;
          const body = err instanceof AppError
            ? err.toJSON()
            : { error: "INTERNAL_ERROR", message: "An unexpected error occurred" };

          reply.raw.writeHead(statusCode, { "Content-Type": "application/json" });
          reply.raw.end(JSON.stringify(body));
        }
        app.log.error({ err, requestId }, "MCP request failed");
      }
    },
  });
}
