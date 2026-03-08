import { z } from "zod";
import { SendMessageInputSchema } from "../message.js";

export { SendMessageInputSchema };
export type { SendMessageInput } from "../message.js";

export const SendMessageOutputSchema = z.object({
  messageId: z.string().optional(),
  accepted: z.array(z.string()),
  rejected: z.array(z.string()),
  sentAt: z.string().datetime(),
});

export type SendMessageOutput = z.infer<typeof SendMessageOutputSchema>;
