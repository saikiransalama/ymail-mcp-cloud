import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MailProvider } from "@ymail-mcp/mailbox-core";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import { normalizeErrorForMcp } from "../errors.js";

export function registerArchiveMessage(
  server: McpServer,
  getProvider: () => MailProvider,
  getContext: () => Promise<UserContext>
): void {
  server.tool(
    "archive_message",
    "Move an email message to the Yahoo Archive folder. This changes mailbox state by moving the message out of its current folder. The message is not deleted.",
    {
      messageId: z
        .string()
        .min(1)
        .describe("The message UID to archive"),
      folder: z
        .string()
        .default("INBOX")
        .describe("Source folder containing the message (default: INBOX)"),
    },
    async ({ messageId, folder }) => {
      try {
        const ctx = await getContext();
        const provider = getProvider();
        const output = await provider.archiveMessage({ messageId, folder }, ctx);
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
