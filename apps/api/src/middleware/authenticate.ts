import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken, extractBearerToken } from "@ymail-mcp/security";
import { findUserById } from "@ymail-mcp/db";
import { AppError } from "@ymail-mcp/shared-types";

/**
 * Fastify preHandler that validates the JWT bearer token and attaches `req.user`.
 */
export async function authenticate(
  req: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw new AppError("UNAUTHORIZED", "Missing Authorization header");
  }

  const payload = verifyToken(token, req.server.config.JWT_SECRET);
  if (!payload || !payload.sub) {
    throw new AppError("UNAUTHORIZED", "Invalid or expired token");
  }

  // Verify user still exists
  const user = await findUserById(req.server.db, payload.sub);
  if (!user) {
    throw new AppError("UNAUTHORIZED", "User not found");
  }

  req.user = { id: user.id, email: user.email };
}
