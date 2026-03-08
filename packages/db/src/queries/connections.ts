import { and, eq } from "drizzle-orm";
import type { DbClient } from "../client.js";
import {
  mailConnections,
  type MailConnectionRow,
  type NewMailConnectionRow,
} from "../schema/mail-connections.js";

export async function findConnectionByUserId(
  db: DbClient,
  userId: string
): Promise<MailConnectionRow | null> {
  const result = await db
    .select()
    .from(mailConnections)
    .where(
      and(
        eq(mailConnections.userId, userId),
        eq(mailConnections.status, "active")
      )
    )
    .orderBy(mailConnections.createdAt)
    .limit(1);
  return result[0] ?? null;
}

export async function findConnectionById(
  db: DbClient,
  id: string,
  userId: string
): Promise<MailConnectionRow | null> {
  const result = await db
    .select()
    .from(mailConnections)
    .where(
      and(eq(mailConnections.id, id), eq(mailConnections.userId, userId))
    )
    .limit(1);
  return result[0] ?? null;
}

export async function listConnectionsByUserId(
  db: DbClient,
  userId: string
): Promise<MailConnectionRow[]> {
  return db
    .select()
    .from(mailConnections)
    .where(eq(mailConnections.userId, userId))
    .orderBy(mailConnections.createdAt);
}

export async function createConnection(
  db: DbClient,
  input: Omit<NewMailConnectionRow, "id" | "createdAt" | "updatedAt">
): Promise<MailConnectionRow> {
  const result = await db
    .insert(mailConnections)
    .values(input)
    .returning();
  return result[0];
}

export async function updateConnectionStatus(
  db: DbClient,
  id: string,
  status: "active" | "error" | "disconnected"
): Promise<void> {
  await db
    .update(mailConnections)
    .set({ status, updatedAt: new Date() })
    .where(eq(mailConnections.id, id));
}

export async function deleteConnection(
  db: DbClient,
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(mailConnections)
    .where(
      and(eq(mailConnections.id, id), eq(mailConnections.userId, userId))
    )
    .returning();
  return result.length > 0;
}

export async function listAllActiveConnections(
  db: DbClient
): Promise<MailConnectionRow[]> {
  return db
    .select()
    .from(mailConnections)
    .where(eq(mailConnections.status, "active"));
}
