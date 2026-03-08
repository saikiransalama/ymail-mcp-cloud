import {
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

export const mailConnections = pgTable("mail_connections", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("yahoo"),
  authMode: text("auth_mode").notNull().default("app_password"),
  // AES-256-GCM encrypted JSON blob: { email, appPassword }
  encryptedSecretBlob: text("encrypted_secret_blob").notNull(),
  iv: text("iv").notNull(),
  authTag: text("auth_tag").notNull(),
  // active | error | disconnected
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MailConnectionRow = typeof mailConnections.$inferSelect;
export type NewMailConnectionRow = typeof mailConnections.$inferInsert;
