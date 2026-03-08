import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/authenticate.js";
import { findConnectionByUserId } from "@ymail-mcp/db";
import { decryptSecret } from "@ymail-mcp/security";
import { pingImapConnection } from "@ymail-mcp/provider-yahoo";
import { AppError } from "@ymail-mcp/shared-types";

export async function testConnectionRoute(app: FastifyInstance): Promise<void> {
  app.post(
    "/connections/yahoo/test",
    { preHandler: authenticate },
    async (req, reply) => {
      const connection = await findConnectionByUserId(app.db, req.user.id);
      if (!connection) {
        throw new AppError(
          "CONNECTION_NOT_FOUND",
          "No active Yahoo connection found"
        );
      }

      const plaintext = decryptSecret(
        {
          blob: connection.encryptedSecretBlob,
          iv: connection.iv,
          authTag: connection.authTag,
        },
        app.config.MASTER_KEY
      );

      const credentials = JSON.parse(plaintext) as {
        email: string;
        appPassword: string;
      };

      const isAlive = await pingImapConnection(req.user.id, credentials);

      return reply.send({
        status: isAlive ? "connected" : "error",
        provider: connection.provider,
        connectionId: connection.id,
      });
    }
  );
}
