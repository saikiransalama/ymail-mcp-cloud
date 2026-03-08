import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MailProvider } from "@ymail-mcp/mailbox-core";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import { normalizeErrorForMcp } from "../errors.js";

export function registerListMessages(
  server: McpServer,
  getProvider: () => MailProvider,
  getContext: () => Promise<UserContext>
): void {
  server.tool(
    "list_messages",
    "List messages in a mailbox folder. Returns message summaries with sender, subject, date, and read status.",
    {
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
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from a previous list_messages response"),
      unreadOnly: z
        .boolean()
        .optional()
        .describe("If true, return only unread messages"),
    },
    async ({ folder, limit, cursor, unreadOnly }) => {
      try {
        const ctx = await getContext();
        const provider = getProvider();
        const output = await provider.listMessages(
          { folder, limit, cursor, unreadOnly },
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
