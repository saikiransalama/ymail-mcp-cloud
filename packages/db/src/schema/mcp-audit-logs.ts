import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const mcpAuditLogs = pgTable("mcp_audit_logs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  connectionId: uuid("connection_id"),
  toolName: text("tool_name").notNull(),
  requestId: text("request_id").notNull(),
  // ok | error
  status: text("status").notNull(),
  errorCode: text("error_code"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type McpAuditLogRow = typeof mcpAuditLogs.$inferSelect;
export type NewMcpAuditLogRow = typeof mcpAuditLogs.$inferInsert;
