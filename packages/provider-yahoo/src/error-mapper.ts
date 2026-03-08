import { AppError } from "@ymail-mcp/shared-types";
import { imapError, smtpError, yahooAuthError } from "@ymail-mcp/mailbox-core";

const AUTH_ERROR_PATTERNS = [
  /invalid credentials/i,
  /authentication failed/i,
  /auth failed/i,
  /login failed/i,
  /\[authenticationfailed\]/i,
  /\[auth\]/i,
  /bad credentials/i,
  /app password/i,
  /account not recognized/i,
];

const TIMEOUT_PATTERNS = [
  /timeout/i,
  /timed out/i,
  /ETIMEDOUT/,
  /ESOCKETTIMEDOUT/,
];

const NETWORK_PATTERNS = [
  /ECONNREFUSED/,
  /ENOTFOUND/,
  /ECONNRESET/,
  /EPIPE/,
  /network/i,
];

function isAuthError(err: Error): boolean {
  return AUTH_ERROR_PATTERNS.some((p) => p.test(err.message));
}

function isTimeoutError(err: Error): boolean {
  return TIMEOUT_PATTERNS.some((p) => p.test(err.message));
}

export function mapImapError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  const error = err instanceof Error ? err : new Error(String(err));

  if (isAuthError(error)) {
    return yahooAuthError(
      "Yahoo IMAP authentication failed. Check your email and app password.",
      error
    );
  }

  if (isTimeoutError(error)) {
    return imapError("Yahoo IMAP connection timed out. Please try again.", error);
  }

  if (NETWORK_PATTERNS.some((p) => p.test(error.message))) {
    return imapError("Could not connect to Yahoo IMAP. Check network connectivity.", error);
  }

  return imapError(`Yahoo IMAP error: ${error.message}`, error);
}

export function mapSmtpError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  const error = err instanceof Error ? err : new Error(String(err));

  if (isAuthError(error)) {
    return yahooAuthError(
      "Yahoo SMTP authentication failed. Check your email and app password.",
      error
    );
  }

  if (isTimeoutError(error)) {
    return smtpError("Yahoo SMTP connection timed out. Please try again.", error);
  }

  return smtpError(`Yahoo SMTP error: ${error.message}`, error);
}
