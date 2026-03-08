import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MailProvider } from "@ymail-mcp/mailbox-core";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import { normalizeErrorForMcp } from "../errors.js";

export function registerMarkRead(
  server: McpServer,
  getProvider: () => MailProvider,
  getContext: () => Promise<UserContext>
): void {
  server.tool(
    "mark_read",
    "Mark an email message as read (sets the \\Seen flag). This changes mailbox state.",
    {
      messageId: z
        .string()
        .min(1)
        .describe("The message UID to mark as read"),
      folder: z
        .string()
        .default("INBOX")
        .describe("Mailbox folder containing the message"),
    },
    async ({ messageId, folder }) => {
      try {
        const ctx = await getContext();
        const provider = getProvider();
        const output = await provider.markRead({ messageId, folder }, ctx);
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
