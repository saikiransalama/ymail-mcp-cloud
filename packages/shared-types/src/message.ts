import { z } from "zod";

export const EmailAddressSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
});

export type EmailAddress = z.infer<typeof EmailAddressSchema>;

export const MessageFlagsSchema = z.object({
  seen: z.boolean(),
  flagged: z.boolean(),
  answered: z.boolean(),
  draft: z.boolean(),
});

export type MessageFlags = z.infer<typeof MessageFlagsSchema>;

export const MessageSummarySchema = z.object({
  id: z.string(),
  uid: z.number().optional(),
  folder: z.string(),
  subject: z.string(),
  from: z.array(EmailAddressSchema),
  to: z.array(EmailAddressSchema),
  date: z.string().datetime(),
  snippet: z.string(),
  flags: MessageFlagsSchema,
  hasAttachments: z.boolean(),
});

export type MessageSummary = z.infer<typeof MessageSummarySchema>;

export const NormalizedMessageSchema = z.object({
  id: z.string(),
  uid: z.number().optional(),
  threadId: z.string().optional(),
  folder: z.string(),
  subject: z.string(),
  from: z.array(EmailAddressSchema),
  to: z.array(EmailAddressSchema),
  cc: z.array(EmailAddressSchema).optional(),
  bcc: z.array(EmailAddressSchema).optional(),
  replyTo: z.array(EmailAddressSchema).optional(),
  date: z.string().datetime(),
  snippet: z.string(),
  textBody: z.string().optional(),
  htmlBody: z.string().optional(),
  flags: MessageFlagsSchema,
  hasAttachments: z.boolean(),
  headers: z.record(z.string()).optional(),
});

export type NormalizedMessage = z.infer<typeof NormalizedMessageSchema>;

export const FolderInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  delimiter: z.string().optional(),
  flags: z.array(z.string()).optional(),
  specialUse: z.string().optional(),
  exists: z.number().optional(),
  unseen: z.number().optional(),
});

export type FolderInfo = z.infer<typeof FolderInfoSchema>;

export const SendMessageInputSchema = z.object({
  to: z
    .array(EmailAddressSchema)
    .min(1, "At least one recipient required")
    .max(50, "Too many recipients"),
  cc: z.array(EmailAddressSchema).max(50).optional(),
  bcc: z.array(EmailAddressSchema).max(50).optional(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(500, "Subject too long"),
  textBody: z.string().min(1, "Message body is required").max(100_000),
  htmlBody: z.string().max(200_000).optional(),
  replyToMessageId: z.string().optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;
