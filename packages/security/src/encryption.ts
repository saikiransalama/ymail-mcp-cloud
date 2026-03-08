import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { AppError } from "@ymail-mcp/shared-types";
import { ALGORITHM, IV_LENGTH, KEY_LENGTH, TAG_LENGTH } from "./constants.js";

export interface EncryptedPayload {
  blob: string; // hex-encoded ciphertext
  iv: string; // hex-encoded 12-byte IV
  authTag: string; // hex-encoded 16-byte GCM auth tag
}

/**
 * Encrypts a plaintext string using AES-256-GCM envelope encryption.
 *
 * @param plaintext - The string to encrypt (e.g. JSON-serialized credentials)
 * @param masterKeyHex - 64-char hex string representing the 32-byte master key
 */
export function encryptSecret(
  plaintext: string,
  masterKeyHex: string
): EncryptedPayload {
  if (masterKeyHex.length !== KEY_LENGTH * 2) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Master key must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes)`
    );
  }

  const key = Buffer.from(masterKeyHex, "hex");
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    blob: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 *
 * @throws AppError(INTERNAL_ERROR) if decryption fails (wrong key / corrupted data)
 */
export function decryptSecret(
  payload: EncryptedPayload,
  masterKeyHex: string
): string {
  if (masterKeyHex.length !== KEY_LENGTH * 2) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Master key must be ${KEY_LENGTH * 2} hex characters`
    );
  }

  try {
    const key = Buffer.from(masterKeyHex, "hex");
    const iv = Buffer.from(payload.iv, "hex");
    const authTag = Buffer.from(payload.authTag, "hex");
    const ciphertext = Buffer.from(payload.blob, "hex");

    if (iv.length !== IV_LENGTH) {
      throw new Error(`IV must be ${IV_LENGTH} bytes`);
    }
    if (authTag.length !== TAG_LENGTH) {
      throw new Error(`Auth tag must be ${TAG_LENGTH} bytes`);
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Failed to decrypt credentials — key may be wrong or data corrupted",
      { cause: err instanceof Error ? err.message : String(err) }
    );
  }
}
