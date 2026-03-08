import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MailProvider } from "@ymail-mcp/mailbox-core";
import type { UserContext } from "@ymail-mcp/mailbox-core";
import { registerListFolders } from "./tools/list-folders.js";
import { registerListMessages } from "./tools/list-messages.js";
import { registerSearchMessages } from "./tools/search-messages.js";
import { registerReadMessage } from "./tools/read-message.js";
import { registerSendMessage } from "./tools/send-message.js";
import { registerMarkRead } from "./tools/mark-read.js";
import { registerMarkUnread } from "./tools/mark-unread.js";
import { registerArchiveMessage } from "./tools/archive-message.js";

/**
 * Register all MCP tools on the server.
 *
 * getProvider() and getContext() are called per tool invocation —
 * they may resolve user context lazily from AsyncLocalStorage or
 * via a closure set before each request.
 */
export function registerAllTools(
  server: McpServer,
  getProvider: () => MailProvider,
  getContext: () => Promise<UserContext>
): void {
  registerListFolders(server, getProvider, getContext);
  registerListMessages(server, getProvider, getContext);
  registerSearchMessages(server, getProvider, getContext);
  registerReadMessage(server, getProvider, getContext);
  registerSendMessage(server, getProvider, getContext);
  registerMarkRead(server, getProvider, getContext);
  registerMarkUnread(server, getProvider, getContext);
  registerArchiveMessage(server, getProvider, getContext);
}
