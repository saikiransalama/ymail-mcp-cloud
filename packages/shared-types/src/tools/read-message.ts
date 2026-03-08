import { z } from "zod";
import { NormalizedMessageSchema } from "../message.js";

export const ReadMessageInputSchema = z.object({
  messageId: z.string().min(1).describe("The message ID (UID) to read"),
  folder: z
    .string()
    .default("INBOX")
    .describe("Mailbox folder containing the message"),
  sanitizeHtml: z
    .boolean()
    .default(true)
    .describe("Whether to sanitize HTML body (recommended: true)"),
});

export type ReadMessageInput = z.infer<typeof ReadMessageInputSchema>;

export const ReadMessageOutputSchema = NormalizedMessageSchema;
export type ReadMessageOutput = z.infer<typeof ReadMessageOutputSchema>;
