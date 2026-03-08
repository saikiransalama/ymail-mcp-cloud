import type { DbClient } from "@ymail-mcp/db";
import { findConnectionByUserId } from "@ymail-mcp/db";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import { AppError } from "@ymail-mcp/shared-types";
import { verifyToken, decryptSecret } from "@ymail-mcp/security";
import type { EncryptedPayload } from "@ymail-mcp/security";

interface SecurityDeps {
  jwtSecret: string;
  masterKey: string;
}

/**
 * Resolve a bearer token into a full UserContext with decrypted credentials.
 *
 * Chain: Bearer token → JWT → userId → active connection → decrypt credentials → UserContext
 *
 * Decryption happens here and the plaintext credentials must not be stored
 * beyond the lifetime of the tool call.
 */
export async function resolveUserContext(
  bearerToken: string,
  db: DbClient,
  security: SecurityDeps
): Promise<UserContext> {
  // 1. Verify JWT
  const payload = verifyToken(bearerToken, security.jwtSecret);
  if (!payload) {
    throw new AppError("UNAUTHORIZED", "Invalid or expired bearer token");
  }

  const userId = payload.sub;
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Token missing subject claim");
  }

  // 2. Load active connection
  const connection = await findConnectionByUserId(db, userId);
  if (!connection) {
    throw new AppError(
      "CONNECTION_NOT_FOUND",
      "No active Yahoo Mail connection found. Connect your Yahoo account first."
    );
  }

  // 3. Decrypt credentials (only done here, never stored)
  const encrypted: EncryptedPayload = {
    blob: connection.encryptedSecretBlob,
    iv: connection.iv,
    authTag: connection.authTag,
  };

  const plaintextJson = decryptSecret(encrypted, security.masterKey);
  const credentials = JSON.parse(plaintextJson) as {
    email: string;
    appPassword: string;
  };

  return {
    userId,
    connectionId: connection.id,
    credentials: {
      email: credentials.email,
      appPassword: credentials.appPassword,
    },
  };
}
