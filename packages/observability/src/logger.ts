import pino from "pino";
import { PINO_REDACT_PATHS } from "./sensitive-keys.js";
import { getLogContext } from "./log-context.js";

export type Logger = pino.Logger;

/**
 * Creates a named logger with structured output and automatic secret redaction.
 * In development (NODE_ENV=development), uses pino-pretty for human-readable output.
 */
export function createLogger(name: string, level?: string): Logger {
  const logLevel = level ?? process.env.LOG_LEVEL ?? "info";
  const isDev = process.env.NODE_ENV === "development";

  const baseLogger = pino({
    name,
    level: logLevel,
    redact: {
      paths: PINO_REDACT_PATHS,
      censor: "[REDACTED]",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Inject log context (requestId, userId, toolName) from AsyncLocalStorage
    mixin() {
      const ctx = getLogContext();
      if (!ctx) return {};
      return {
        requestId: ctx.requestId,
        ...(ctx.userId ? { userId: ctx.userId } : {}),
        ...(ctx.toolName ? { toolName: ctx.toolName } : {}),
        ...(ctx.connectionId ? { connectionId: ctx.connectionId } : {}),
      };
    },
    ...(isDev
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          },
        }
      : {}),
  });

  return baseLogger;
}

// Root application logger
export const rootLogger = createLogger("ymail-mcp");
