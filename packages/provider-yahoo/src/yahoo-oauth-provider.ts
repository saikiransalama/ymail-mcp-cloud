/**
 * Yahoo OAuth Provider — V1.1 Stub
 *
 * This class is a placeholder for the future Yahoo OAuth authorization code flow.
 * Yahoo restricts OAuth mail scopes to approved applications only.
 *
 * To implement:
 * 1. Register your app at https://developer.yahoo.com/apps/
 * 2. Request mail read/write scopes (approval required)
 * 3. Implement the OAuth 2.0 authorization code flow
 * 4. Store tokens (access + refresh) encrypted in mail_connections
 * 5. Implement token refresh logic
 * 6. Use XOAUTH2 for IMAP authentication
 *
 * Until Yahoo grants restricted-scope access, this provider will not be usable
 * in production. Enable with feature flag: FEATURE_OAUTH_ENABLED=true
 */
import { AppError } from "@ymail-mcp/shared-types";
import type { MailProvider, UserContext } from "@ymail-mcp/mailbox-core";
import type {
  ActionResult,
  ListFoldersOutput,
  ListMessagesInput,
  ListMessagesOutput,
  MessageActionInput,
  ReadMessageInput,
  ReadMessageOutput,
  SearchMessagesInput,
  SearchMessagesOutput,
  SendMessageInput,
  SendMessageOutput,
} from "@ymail-mcp/shared-types";

function notImplemented(): never {
  throw new AppError(
    "NOT_IMPLEMENTED",
    "Yahoo OAuth provider is not yet available. Use app-password authentication."
  );
}

export class YahooOAuthProvider implements MailProvider {
  listFolders(_ctx: UserContext): Promise<ListFoldersOutput> {
    return notImplemented();
  }

  listMessages(_input: ListMessagesInput, _ctx: UserContext): Promise<ListMessagesOutput> {
    return notImplemented();
  }

  searchMessages(_input: SearchMessagesInput, _ctx: UserContext): Promise<SearchMessagesOutput> {
    return notImplemented();
  }

  readMessage(_input: ReadMessageInput, _ctx: UserContext): Promise<ReadMessageOutput> {
    return notImplemented();
  }

  sendMessage(_input: SendMessageInput, _ctx: UserContext): Promise<SendMessageOutput> {
    return notImplemented();
  }

  markRead(_input: MessageActionInput, _ctx: UserContext): Promise<ActionResult> {
    return notImplemented();
  }

  markUnread(_input: MessageActionInput, _ctx: UserContext): Promise<ActionResult> {
    return notImplemented();
  }

  archiveMessage(_input: MessageActionInput, _ctx: UserContext): Promise<ActionResult> {
    return notImplemented();
  }
}
