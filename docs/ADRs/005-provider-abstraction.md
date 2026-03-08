# ADR 005 — MailProvider Interface Abstraction

## Status
Accepted

## Context
The system needs to support Yahoo Mail now and potentially other providers (Gmail, Outlook) or auth modes (app password, OAuth) in the future without rewriting the MCP tool layer.

## Decision
Define a `MailProvider` interface in `packages/mailbox-core` and implement it separately for each backend. The MCP tool handlers only depend on the interface, never on concrete implementations.

## Rationale
- Decouples MCP tool logic from IMAP/SMTP implementation details
- Enables testing with mock providers (no real Yahoo credentials needed in unit tests)
- Supports multiple auth modes for the same provider (app password vs OAuth) without changing tool code
- Follows the Dependency Inversion principle
- Makes the architecture clear and documentable

## Interface Design
```typescript
interface MailProvider {
  listFolders(ctx: UserContext): Promise<ListFoldersOutput>;
  listMessages(input, ctx): Promise<ListMessagesOutput>;
  searchMessages(input, ctx): Promise<SearchMessagesOutput>;
  readMessage(input, ctx): Promise<ReadMessageOutput>;
  sendMessage(input, ctx): Promise<SendMessageOutput>;
  markRead(input, ctx): Promise<ActionResult>;
  markUnread(input, ctx): Promise<ActionResult>;
  archiveMessage(input, ctx): Promise<ActionResult>;
}
```

## Implementations
- `YahooAppPasswordProvider` (V1) — imapflow + nodemailer, app-password auth
- `YahooOAuthProvider` (V1.1 stub) — placeholder, throws NOT_IMPLEMENTED
- Future: `GmailProvider`, `OutlookProvider`

## Consequences
- All new email providers must implement the full interface
- Optional capabilities (attachments, threading) will need interface extensions in future versions
- The provider is instantiated per-request (stateless), so it must not hold mutable state
