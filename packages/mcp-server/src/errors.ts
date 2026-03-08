import { AppError, isAppError } from "@ymail-mcp/shared-types";

export interface McpErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Normalize any error into a structured MCP-compatible error response.
 * Secrets must never appear in the output.
 */
export function normalizeErrorForMcp(err: unknown): McpErrorResponse {
  if (isAppError(err)) {
    return {
      code: err.code,
      message: err.message,
    };
  }

  if (err instanceof Error) {
    // Sanitize — don't expose internal error messages that may contain credentials
    const safeMessage = sanitizeErrorMessage(err.message);
    return {
      code: "INTERNAL_ERROR",
      message: safeMessage,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  };
}

const CREDENTIAL_PATTERNS = [
  /\b(password|appPassword|secret|masterKey|encryptedSecretBlob|authTag|jwt)\b/i,
];

function sanitizeErrorMessage(message: string): string {
  // If the message looks like it might contain credentials, return generic message
  if (CREDENTIAL_PATTERNS.some((p) => p.test(message) && message.length < 50)) {
    return "An internal error occurred";
  }
  return message;
}

export { AppError, isAppError };
