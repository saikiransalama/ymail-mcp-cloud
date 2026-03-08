import type {
  FolderInfo,
  ListFoldersOutput,
  ListMessagesInput,
  ListMessagesOutput,
  SearchMessagesInput,
  SearchMessagesOutput,
  ReadMessageInput,
  ReadMessageOutput,
  SendMessageInput,
  SendMessageOutput,
  MessageActionInput,
  ActionResult,
} from "@ymail-mcp/shared-types";
import type { UserContext } from "./types.js";

/**
 * Abstract mailbox provider interface.
 * Implement this for each backend: YahooAppPasswordProvider, YahooOAuthProvider, etc.
 */
export interface MailProvider {
  listFolders(ctx: UserContext): Promise<ListFoldersOutput>;

  listMessages(
    input: ListMessagesInput,
    ctx: UserContext
  ): Promise<ListMessagesOutput>;

  searchMessages(
    input: SearchMessagesInput,
    ctx: UserContext
  ): Promise<SearchMessagesOutput>;

  readMessage(
    input: ReadMessageInput,
    ctx: UserContext
  ): Promise<ReadMessageOutput>;

  sendMessage(
    input: SendMessageInput,
    ctx: UserContext
  ): Promise<SendMessageOutput>;

  markRead(input: MessageActionInput, ctx: UserContext): Promise<ActionResult>;

  markUnread(
    input: MessageActionInput,
    ctx: UserContext
  ): Promise<ActionResult>;

  archiveMessage(
    input: MessageActionInput,
    ctx: UserContext
  ): Promise<ActionResult>;
}
