import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { createConnection } from "@ymail-mcp/db";
import { encryptSecret } from "@ymail-mcp/security";
import { AppError } from "@ymail-mcp/shared-types";
import { pingImapConnection, evictImapConnection } from "@ymail-mcp/provider-yahoo";

const CreateConnectionBody = z.object({
  yahooEmail: z
    .string()
    .email("Must be a valid email address")
    .refine(
      (e) =>
        e.endsWith("@yahoo.com") ||
        e.endsWith("@ymail.com") ||
        e.endsWith("@yahoo.co.uk") ||
        e.endsWith("@yahoo.com.au") ||
        e.includes("yahoo"),
      "Must be a Yahoo email address"
    ),
  appPassword: z
    .string()
    .min(4, "App password is too short")
    .max(64, "App password is too long"),
});

export async function createConnectionRoute(app: FastifyInstance): Promise<void> {
  app.post(
    "/connections/yahoo",
    { preHandler: authenticate },
    async (req, reply) => {
      const body = CreateConnectionBody.safeParse(req.body);
      if (!body.success) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Invalid connection data",
          body.error.errors
        );
      }

      const { yahooEmail, appPassword } = body.data;
      const userId = req.user.id;

      // Encrypt credentials before storing
      const secretJson = JSON.stringify({ email: yahooEmail, appPassword });
      const encrypted = encryptSecret(secretJson, app.config.MASTER_KEY);

      // Test the IMAP connection before saving
      try {
        const isValid = await pingImapConnection(userId, {
          email: yahooEmail,
          appPassword,
        });
        if (!isValid) {
          throw new AppError(
            "YAHOO_AUTH_FAILED",
            "Could not connect to Yahoo IMAP with the provided credentials. Check your email and app password."
          );
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(
          "YAHOO_AUTH_FAILED",
          "Yahoo authentication failed. Please check your email and app password.",
          { hint: "Make sure you are using an App Password, not your account password." }
        );
      }

      let connection;
      try {
        connection = await createConnection(app.db, {
          userId,
          provider: "yahoo",
          authMode: "app_password",
          encryptedSecretBlob: encrypted.blob,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          status: "active",
        });
      } catch (err) {
        await evictImapConnection(userId).catch(() => {});
        throw err;
      }

      req.log.info(
        { userId, connectionId: connection.id },
        "Yahoo connection created"
      );

      return reply.status(201).send({
        id: connection.id,
        provider: connection.provider,
        authMode: connection.authMode,
        status: connection.status,
        createdAt: connection.createdAt,
      });
    }
  );
}
