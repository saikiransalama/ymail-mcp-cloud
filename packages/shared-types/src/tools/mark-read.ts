import { z } from "zod";

export const MessageActionInputSchema = z.object({
  messageId: z.string().min(1).describe("The message ID (UID) to act on"),
  folder: z
    .string()
    .default("INBOX")
    .describe("Mailbox folder containing the message"),
});

export type MessageActionInput = z.infer<typeof MessageActionInputSchema>;

export const ActionResultSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
});

export type ActionResult = z.infer<typeof ActionResultSchema>;
