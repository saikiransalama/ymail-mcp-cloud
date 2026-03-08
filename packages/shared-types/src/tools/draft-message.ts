import { z } from "zod";
import { SendMessageInputSchema } from "../message.js";

// V1.1 stub — same input shape as send_message but saves to Drafts
export const DraftMessageInputSchema = SendMessageInputSchema;
export type DraftMessageInput = z.infer<typeof DraftMessageInputSchema>;

export const DraftMessageOutputSchema = z.object({
  draftId: z.string(),
  savedAt: z.string().datetime(),
});

export type DraftMessageOutput = z.infer<typeof DraftMessageOutputSchema>;
