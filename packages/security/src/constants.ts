export const KEY_LENGTH = 32; // bytes — AES-256
export const IV_LENGTH = 12; // bytes — GCM recommended
export const TAG_LENGTH = 16; // bytes — GCM auth tag
export const ALGORITHM = "aes-256-gcm" as const;

export const ARGON2_CONFIG = {
  type: 2, // argon2id
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
} as const;

// Sensitive field names — used for redaction
export const SENSITIVE_FIELDS = [
  "password",
  "appPassword",
  "token",
  "secret",
  "encryptedSecretBlob",
  "encrypted_secret_blob",
  "iv",
  "authTag",
  "auth_tag",
  "passwordHash",
  "password_hash",
  "masterKey",
  "jwtSecret",
  "authorization",
] as const;
