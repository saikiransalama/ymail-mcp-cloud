import { z } from "zod";
import { MessageSummarySchema } from "../message.js";

export const ListMessagesInputSchema = z.object({
  folder: z
    .string()
    .default("INBOX")
    .describe("Mailbox folder name (default: INBOX)"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum number of messages to return (1-100)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
  unreadOnly: z.boolean().optional().describe("If true, return only unread messages"),
});

export type ListMessagesInput = z.infer<typeof ListMessagesInputSchema>;

export const ListMessagesOutputSchema = z.object({
  messages: z.array(MessageSummarySchema),
  nextCursor: z.string().optional(),
  folder: z.string(),
});

export type ListMessagesOutput = z.infer<typeof ListMessagesOutputSchema>;
