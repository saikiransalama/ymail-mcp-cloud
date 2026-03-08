import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MailProvider } from "@ymail-mcp/mailbox-core";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import { normalizeErrorForMcp } from "../errors.js";

const EmailAddressSchema = z.object({
  name: z.string().optional().describe("Display name"),
  email: z.string().email().describe("Email address"),
});

export function registerSendMessage(
  server: McpServer,
  getProvider: () => MailProvider,
  getContext: () => Promise<UserContext>
): void {
  server.tool(
    "send_message",
    "Send an email from the connected Yahoo Mail account. This action sends a real email — use carefully. Limited to 10 sends per minute.",
    {
      to: z
        .array(EmailAddressSchema)
        .min(1)
        .max(50)
        .describe("Recipients (required). At least one recipient is required."),
      cc: z
        .array(EmailAddressSchema)
        .max(50)
        .optional()
        .describe("Carbon copy recipients"),
      bcc: z
        .array(EmailAddressSchema)
        .max(50)
        .optional()
        .describe("Blind carbon copy recipients"),
      subject: z
        .string()
        .min(1)
        .max(500)
        .describe("Email subject line"),
      textBody: z
        .string()
        .min(1)
        .max(100_000)
        .describe("Plain text message body (required)"),
      htmlBody: z
        .string()
        .max(200_000)
        .optional()
        .describe("Optional HTML message body"),
      replyToMessageId: z
        .string()
        .optional()
        .describe("If replying, the Message-ID of the original message"),
    },
    async ({ to, cc, bcc, subject, textBody, htmlBody, replyToMessageId }) => {
      try {
        const ctx = await getContext();
        const provider = getProvider();
        const output = await provider.sendMessage(
          { to, cc, bcc, subject, textBody, htmlBody, replyToMessageId },
          ctx
        );
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        };
      } catch (err) {
        const normalized = normalizeErrorForMcp(err);
        return {
          content: [{ type: "text", text: JSON.stringify(normalized) }],
          isError: true,
        };
      }
    }
  );
}
