import { ImapFlow } from "imapflow";
import { Mutex } from "async-mutex";
import type { ProviderCredentials } from "@ymail-mcp/mailbox-core";
import { createLogger } from "@ymail-mcp/observability";
import {
  IMAP_GREETING_TIMEOUT_MS,
  IMAP_HOST,
  IMAP_PORT,
  IMAP_SECURE,
  IMAP_TIMEOUT_MS,
  POOL_IDLE_TIMEOUT_MS,
  POOL_MAX,
} from "./constants.js";
import { mapImapError } from "./error-mapper.js";

const logger = createLogger("imap-client");

interface PoolEntry {
  client: ImapFlow;
  mutex: Mutex;
  lastUsed: number;
  userId: string;
}

const pool = new Map<string, PoolEntry>();
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Get or create an ImapFlow connection for the given user.
 * Returns the pool entry (client + mutex).
 *
 * IMPORTANT: Always acquire the mutex before using the client.
 * imapflow connections are not concurrency-safe.
 */
export async function getImapEntry(
  userId: string,
  credentials: ProviderCredentials
): Promise<PoolEntry> {
  const existing = pool.get(userId);

  if (existing) {
    // Verify connection is still alive
    if (existing.client.authenticated) {
      existing.lastUsed = Date.now();
      return existing;
    }
    // Dead connection — remove and reconnect
    logger.debug({ userId }, "IMAP connection stale, reconnecting");
    pool.delete(userId);
    try {
      await existing.client.logout();
    } catch {
      // Ignore logout errors on dead connections
    }
  }

  if (pool.size >= POOL_MAX) {
    // Evict the oldest entry
    const oldest = [...pool.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0];
    if (oldest) {
      logger.warn({ evictedUserId: oldest[0] }, "IMAP pool at capacity, evicting oldest entry");
      try {
        await oldest[1].client.logout();
      } catch {
        // Ignore
      }
      pool.delete(oldest[0]);
    }
  }

  logger.debug({ userId }, "Creating new IMAP connection");
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: IMAP_SECURE,
    auth: {
      user: credentials.email,
      pass: credentials.appPassword,
    },
    logger: false, // Use our own logger
    greetingTimeout: IMAP_GREETING_TIMEOUT_MS,
    socketTimeout: IMAP_TIMEOUT_MS,
    tls: {
      rejectUnauthorized: true,
    },
  });

  try {
    await client.connect();
  } catch (err) {
    throw mapImapError(err);
  }

  const entry: PoolEntry = {
    client,
    mutex: new Mutex(),
    lastUsed: Date.now(),
    userId,
  };

  pool.set(userId, entry);
  ensureCleanupRunning();

  return entry;
}

/**
 * Execute a function while holding the IMAP connection lock.
 * Ensures no concurrent operations on the same connection.
 */
export async function withImap<T>(
  userId: string,
  credentials: ProviderCredentials,
  fn: (client: ImapFlow) => Promise<T>
): Promise<T> {
  const entry = await getImapEntry(userId, credentials);
  return entry.mutex.runExclusive(async () => {
    entry.lastUsed = Date.now();
    try {
      return await fn(entry.client);
    } catch (err) {
      // On auth errors, remove the connection from pool
      const mapped = mapImapError(err);
      if (mapped.code === "YAHOO_AUTH_FAILED") {
        pool.delete(userId);
        try { await entry.client.logout(); } catch { /* ignore */ }
      }
      throw mapped;
    }
  });
}

/**
 * Remove a user's IMAP connection from the pool (e.g., on disconnect).
 */
export async function evictImapConnection(userId: string): Promise<void> {
  const entry = pool.get(userId);
  if (entry) {
    pool.delete(userId);
    try {
      await entry.client.logout();
    } catch {
      // Ignore
    }
  }
}

/**
 * Ping the IMAP connection to verify it's still alive.
 * Returns true if connected, false otherwise.
 */
export async function pingImapConnection(
  userId: string,
  credentials: ProviderCredentials
): Promise<boolean> {
  try {
    const entry = await getImapEntry(userId, credentials);
    return entry.mutex.runExclusive(async () => {
      await entry.client.noop();
      return true;
    });
  } catch {
    pool.delete(userId);
    return false;
  }
}

function ensureCleanupRunning(): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(cleanupIdleConnections, 60_000); // Every minute
}

function cleanupIdleConnections(): void {
  const now = Date.now();
  for (const [userId, entry] of pool.entries()) {
    if (now - entry.lastUsed > POOL_IDLE_TIMEOUT_MS) {
      logger.debug({ userId }, "Evicting idle IMAP connection");
      pool.delete(userId);
      entry.client.logout().catch(() => {});
    }
  }
}

export { pool as _imapPool };
