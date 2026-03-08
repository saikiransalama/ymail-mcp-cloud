import { eq } from "drizzle-orm";
import type { DbClient } from "../client.js";
import { users, type NewUserRow, type UserRow } from "../schema/users.js";

export async function findUserByEmail(
  db: DbClient,
  email: string
): Promise<UserRow | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result[0] ?? null;
}

export async function findUserById(
  db: DbClient,
  id: string
): Promise<UserRow | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createUser(
  db: DbClient,
  input: Pick<NewUserRow, "email" | "passwordHash">
): Promise<UserRow> {
  const result = await db
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
    })
    .returning();
  return result[0];
}

export async function deleteUser(db: DbClient, id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}
