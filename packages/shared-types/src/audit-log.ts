import { z } from "zod";

export const AuditLogStatusSchema = z.enum(["ok", "error"]);
export type AuditLogStatus = z.infer<typeof AuditLogStatusSchema>;

export const AuditLogRowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  connectionId: z.string().uuid().nullable(),
  toolName: z.string(),
  requestId: z.string(),
  status: AuditLogStatusSchema,
  errorCode: z.string().nullable(),
  durationMs: z.number().int().nullable(),
  createdAt: z.coerce.date(),
});

export type AuditLogRow = z.infer<typeof AuditLogRowSchema>;

export const AuditLogInsertSchema = z.object({
  userId: z.string().uuid(),
  connectionId: z.string().uuid().optional(),
  toolName: z.string(),
  requestId: z.string(),
  status: AuditLogStatusSchema,
  errorCode: z.string().optional(),
  durationMs: z.number().int().optional(),
});

export type AuditLogInsert = z.infer<typeof AuditLogInsertSchema>;
