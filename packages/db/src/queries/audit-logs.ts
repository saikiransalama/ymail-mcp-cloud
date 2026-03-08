import { desc, eq } from "drizzle-orm";
import type { DbClient } from "../client.js";
import {
  mcpAuditLogs,
  type McpAuditLogRow,
  type NewMcpAuditLogRow,
} from "../schema/mcp-audit-logs.js";

export async function insertAuditLog(
  db: DbClient,
  input: Omit<NewMcpAuditLogRow, "id" | "createdAt">
): Promise<McpAuditLogRow> {
  const result = await db
    .insert(mcpAuditLogs)
    .values(input)
    .returning();
  return result[0];
}

export async function listAuditLogsByUser(
  db: DbClient,
  userId: string,
  limit: number = 50
): Promise<McpAuditLogRow[]> {
  return db
    .select()
    .from(mcpAuditLogs)
    .where(eq(mcpAuditLogs.userId, userId))
    .orderBy(desc(mcpAuditLogs.createdAt))
    .limit(limit);
}
