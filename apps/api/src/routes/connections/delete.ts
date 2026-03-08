import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/authenticate.js";
import { deleteConnection } from "@ymail-mcp/db";
import { evictImapConnection } from "@ymail-mcp/provider-yahoo";
import { AppError } from "@ymail-mcp/shared-types";

export async function deleteConnectionRoute(app: FastifyInstance): Promise<void> {
  app.delete(
    "/connections/yahoo/:id",
    { preHandler: authenticate },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const userId = req.user.id;

      const deleted = await deleteConnection(app.db, id, userId);
      if (!deleted) {
        throw new AppError(
          "CONNECTION_NOT_FOUND",
          "Connection not found or you don't have access to it"
        );
      }

      // Evict IMAP connection from pool
      await evictImapConnection(userId);

      req.log.info({ userId, connectionId: id }, "Yahoo connection deleted");

      return reply.status(200).send({ success: true });
    }
  );
}
