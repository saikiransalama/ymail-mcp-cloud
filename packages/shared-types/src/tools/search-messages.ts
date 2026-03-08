import { z } from "zod";
import { MessageSummarySchema } from "../message.js";

export const SearchMessagesInputSchema = z.object({
  query: z.string().max(500).optional().describe("Full-text search query"),
  from: z.string().max(255).optional().describe("Filter by sender email or name"),
  subject: z.string().max(500).optional().describe("Filter by subject contains"),
  since: z
    .string()
    .datetime()
    .optional()
    .describe("Return messages after this ISO 8601 date"),
  before: z
    .string()
    .datetime()
    .optional()
    .describe("Return messages before this ISO 8601 date"),
  unreadOnly: z.boolean().optional().describe("If true, return only unread messages"),
  folder: z
    .string()
    .default("INBOX")
    .describe("Mailbox folder to search (default: INBOX)"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe("Maximum number of results (1-50)"),
}).refine(
  (d) => d.query || d.from || d.subject || d.since || d.before || d.unreadOnly,
  { message: "At least one search criterion is required" }
);

export type SearchMessagesInput = z.infer<typeof SearchMessagesInputSchema>;

export const SearchMessagesOutputSchema = z.object({
  messages: z.array(MessageSummarySchema),
  total: z.number().int(),
  folder: z.string(),
});

export type SearchMessagesOutput = z.infer<typeof SearchMessagesOutputSchema>;
