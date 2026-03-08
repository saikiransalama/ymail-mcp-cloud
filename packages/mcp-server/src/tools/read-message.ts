import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MailProvider } from "@ymail-mcp/mailbox-core";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import { normalizeErrorForMcp } from "../errors.js";

export function registerReadMessage(
  server: McpServer,
  getProvider: () => MailProvider,
  getContext: () => Promise<UserContext>
): void {
  server.tool(
    "read_message",
    "Read the full content of a specific email message. Returns the complete message with sanitized HTML body, plain text body, and headers. HTML is automatically sanitized for safety.",
    {
      messageId: z
        .string()
        .min(1)
        .describe("The message UID returned from list_messages or search_messages"),
      folder: z
        .string()
        .default("INBOX")
        .describe("Mailbox folder containing the message (default: INBOX)"),
    },
    async ({ messageId, folder }) => {
      try {
        const ctx = await getContext();
        const provider = getProvider();
        const output = await provider.readMessage(
          { messageId, folder, sanitizeHtml: true },
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
