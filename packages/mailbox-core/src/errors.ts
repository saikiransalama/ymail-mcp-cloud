import { AppError, type ErrorCode } from "@ymail-mcp/shared-types";

/**
 * Create an AppError with Yahoo-specific IMAP error context.
 */
export function imapError(message: string, cause?: unknown): AppError {
  return new AppError("YAHOO_IMAP_ERROR", message, {
    cause: cause instanceof Error ? cause.message : String(cause ?? ""),
  });
}

/**
 * Create an AppError with Yahoo-specific SMTP error context.
 */
export function smtpError(message: string, cause?: unknown): AppError {
  return new AppError("YAHOO_SMTP_ERROR", message, {
    cause: cause instanceof Error ? cause.message : String(cause ?? ""),
  });
}

/**
 * Create an AppError for Yahoo authentication failure.
 */
export function yahooAuthError(message: string, cause?: unknown): AppError {
  return new AppError("YAHOO_AUTH_FAILED", message, {
    cause: cause instanceof Error ? cause.message : String(cause ?? ""),
  });
}

export { AppError, type ErrorCode };
