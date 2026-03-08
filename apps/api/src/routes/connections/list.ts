import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/authenticate.js";
import { listConnectionsByUserId } from "@ymail-mcp/db";

export async function listConnectionsRoute(app: FastifyInstance): Promise<void> {
  app.get(
    "/connections",
    { preHandler: authenticate },
    async (req, reply) => {
      const connections = await listConnectionsByUserId(app.db, req.user.id);

      // Never return encrypted blobs, IV, or auth tags
      const safeConnections = connections.map((c) => ({
        id: c.id,
        provider: c.provider,
        authMode: c.authMode,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      return reply.send({ connections: safeConnections });
    }
  );
}
