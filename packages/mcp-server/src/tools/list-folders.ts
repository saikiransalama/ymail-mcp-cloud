import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MailProvider } from "@ymail-mcp/mailbox-core";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import { normalizeErrorForMcp } from "../errors.js";

export function registerListFolders(
  server: McpServer,
  getProvider: () => MailProvider,
  getContext: () => Promise<UserContext>
): void {
  server.tool(
    "list_folders",
    "List all mailbox folders available in the connected Yahoo Mail account.",
    {},
    async () => {
      try {
        const ctx = await getContext();
        const provider = getProvider();
        const output = await provider.listFolders(ctx);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(output, null, 2),
            },
          ],
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
