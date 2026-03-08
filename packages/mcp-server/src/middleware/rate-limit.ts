import type { Redis } from "ioredis";
import { AppError } from "@ymail-mcp/shared-types";

// Per-tool rate limit overrides (requests per minute)
const TOOL_RATE_LIMITS: Record<string, number> = {
  send_message: 10,
  archive_message: 30,
};
const DEFAULT_RATE_LIMIT = 60;

/**
 * Check per-user, per-tool rate limits using Redis sliding window.
 *
 * @throws AppError(RATE_LIMITED) if limit is exceeded
 */
export async function checkRateLimit(
  redis: Redis,
  userId: string,
  toolName: string
): Promise<void> {
  const limit = TOOL_RATE_LIMITS[toolName] ?? DEFAULT_RATE_LIMIT;
  const windowSeconds = 60;
  const key = `ratelimit:mcp:${userId}:${toolName}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Redis sorted set sliding window counter
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart); // Remove old entries
  pipeline.zadd(key, now, `${now}-${Math.random()}`); // Add current request
  pipeline.zcard(key); // Count in window
  pipeline.expire(key, windowSeconds + 1); // Keep key alive

  const results = await pipeline.exec();
  if (!results) throw new AppError("INTERNAL_ERROR", "Rate limit check failed");

  const count = results[2]?.[1] as number;

  if (count > limit) {
    throw new AppError(
      "RATE_LIMITED",
      `Rate limit exceeded for ${toolName}. Maximum ${limit} requests per minute.`,
      { limit, window: "60s", current: count }
    );
  }
}
