import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MailProvider } from "@ymail-mcp/mailbox-core";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import { normalizeErrorForMcp } from "../errors.js";

export function registerSearchMessages(
  server: McpServer,
  getProvider: () => MailProvider,
  getContext: () => Promise<UserContext>
): void {
  server.tool(
    "search_messages",
    "Search for messages in Yahoo Mail. Filter by text query, sender, subject, date range, and read status. At least one filter is required.",
    {
      query: z
        .string()
        .max(500)
        .optional()
        .describe("Full-text search query (searches subject and body)"),
      from: z
        .string()
        .max(255)
        .optional()
        .describe("Filter by sender email address or name"),
      subject: z
        .string()
        .max(500)
        .optional()
        .describe("Filter by subject containing this text"),
      since: z
        .string()
        .optional()
        .describe("Return messages after this date (ISO 8601 format, e.g. 2026-01-01)"),
      before: z
        .string()
        .optional()
        .describe("Return messages before this date (ISO 8601 format)"),
      unreadOnly: z
        .boolean()
        .optional()
        .describe("If true, return only unread messages"),
      folder: z
        .string()
        .default("INBOX")
        .describe("Mailbox folder to search (default: INBOX)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(20)
        .describe("Maximum number of results to return (1-50)"),
    },
    async ({ query, from, subject, since, before, unreadOnly, folder, limit }) => {
      try {
        // Require at least one filter
        if (!query && !from && !subject && !since && !before && !unreadOnly) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  code: "VALIDATION_ERROR",
                  message: "At least one search criterion is required (query, from, subject, since, before, or unreadOnly)",
                }),
              },
            ],
            isError: true,
          };
        }

        const ctx = await getContext();
        const provider = getProvider();
        const output = await provider.searchMessages(
          { query, from, subject, since, before, unreadOnly, folder, limit },
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
