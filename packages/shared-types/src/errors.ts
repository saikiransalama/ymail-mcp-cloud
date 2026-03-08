export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONNECTION_NOT_FOUND: "CONNECTION_NOT_FOUND",
  YAHOO_AUTH_FAILED: "YAHOO_AUTH_FAILED",
  YAHOO_IMAP_ERROR: "YAHOO_IMAP_ERROR",
  YAHOO_SMTP_ERROR: "YAHOO_SMTP_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const HTTP_STATUS_MAP: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONNECTION_NOT_FOUND: 404,
  YAHOO_AUTH_FAILED: 502,
  YAHOO_IMAP_ERROR: 502,
  YAHOO_SMTP_ERROR: 502,
  RATE_LIMITED: 429,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
  NOT_IMPLEMENTED: 501,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = HTTP_STATUS_MAP[code];
    this.details = details;
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
