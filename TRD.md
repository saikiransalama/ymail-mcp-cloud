# TRD — Technical Requirements Document

## 1. Recommended architecture

Build this as a remote, multi-tenant MCP service with five layers:

1. MCP transport layer
2. Application auth + user management layer
3. Mailbox provider layer (Yahoo adapter)
4. Persistence + encryption layer
5. Observability + admin layer

## 2. Recommended stack

### Core language
**TypeScript**

### Backend
- Node.js 22+
- Fastify or Express for app/auth/admin APIs
- Official MCP TypeScript SDK
- PostgreSQL
- Redis
- BullMQ or equivalent queue
- Nodemailer for SMTP
- IMAP client library such as `imapflow`

### Infra
- Docker
- Docker Compose for local dev
- Railway / Render / Fly / AWS for deploy
- S3-compatible storage only if later adding attachments
- OpenTelemetry + structured logs
- Sentry optional

## 3. System components

### 3.1 Web app / API
Responsibilities:
- user registration/login
- connect Yahoo mailbox
- store encrypted credentials
- expose admin and health endpoints
- host MCP endpoint

Suggested routes:
- `POST /auth/register`
- `POST /auth/login`
- `POST /connections/yahoo`
- `DELETE /connections/yahoo/:id`
- `GET /me`
- `GET /health`
- `GET|POST /mcp`

### 3.2 MCP server module
Responsibilities:
- implement MCP lifecycle
- publish tool schemas
- authorize incoming user context
- call mailbox service layer
- normalize errors

Expose only tools in V1. Resources and prompts can come later.

### 3.3 Yahoo adapter

Two auth backends:

#### Backend A — app password mode
- store encrypted Yahoo email + app password
- IMAP host `imap.mail.yahoo.com`, port `993`, TLS
- SMTP host `smtp.mail.yahoo.com`, port `465` secure, or `587` with submission auth

#### Backend B — future OAuth mode
- Yahoo app registration
- redirect user to Yahoo authorization endpoint
- exchange code for tokens
- use approved mail scopes if Yahoo grants them

### 3.4 Credential vault service
Responsibilities:
- envelope encryption
- rotate encryption keys
- decrypt only at execution time
- redact secrets in logs

Suggested model:
- per-user credential record encrypted with AES-256-GCM
- data encryption key protected by KMS or master key env secret
- no plaintext persistence

### 3.5 Job queue
Use for:
- background sync metadata
- long-running search/index jobs
- connection health checks
- optional summary generation

### 3.6 Database

Suggested tables:

#### `users`
- id
- email
- password_hash / external_auth_id
- created_at
- updated_at

#### `mail_connections`
- id
- user_id
- provider
- auth_mode (`app_password` | `oauth`)
- encrypted_secret_blob
- status
- created_at
- updated_at

#### `mcp_audit_logs`
- id
- user_id
- connection_id
- tool_name
- request_id
- status
- error_code
- duration_ms
- created_at

## 4. Authentication and authorization design

### 4.1 App-level auth
Your app should authenticate the human user first. Options:
- email/password + JWT session
- Clerk/Auth.js/Supabase Auth
- GitHub sign-in for faster demo polish

### 4.2 MCP-level auth
For remote HTTP, implement authorization compatible with MCP’s HTTP authorization model.

Practical approach:
- MCP request includes bearer token for your service
- service resolves token to app user
- user is mapped to mailbox connection
- tool handler checks permissions

### 4.3 Yahoo-level auth

#### For MVP
- App password only
- Simplest path
- Fastest to demo

#### For future production
- Yahoo OAuth authorization code flow
- Likely blocked until restricted-scope access is granted

## 5. MCP tool design

### 5.1 Required tools

#### `list_messages`
Input:
- folder
- limit
- cursor optional
- unread_only optional

Output:
- array of message summaries
- pagination cursor

#### `search_messages`
Input:
- query
- from
- subject
- since
- before
- unread_only
- folder
- limit

Output:
- matching message summaries

#### `read_message`
Input:
- message_id

Output:
- normalized message object
- text body
- sanitized html body optional
- headers
- flags

#### `send_message`
Input:
- to
- cc
- bcc
- subject
- text_body
- html_body optional
- reply_to_message_id optional

Output:
- provider delivery response
- sent timestamp

#### `mark_read`
Input:
- message_id

#### `mark_unread`
Input:
- message_id

#### `archive_message`
Input:
- message_id

### 5.2 Optional tools
- `list_folders`
- `get_thread`
- `draft_message`
- `summarize_thread`
- `bulk_mark_read` later only with hard limits

### 5.3 Tool schema principles
- use strict JSON schema
- include examples
- cap limits
- forbid ambiguous free-form destructive actions

## 6. Mailbox abstraction

Create a provider interface from day one:

```ts
interface MailProvider {
  listMessages(input: ListMessagesInput, ctx: UserContext): Promise<ListMessagesOutput>;
  searchMessages(input: SearchMessagesInput, ctx: UserContext): Promise<SearchMessagesOutput>;
  readMessage(input: ReadMessageInput, ctx: UserContext): Promise<ReadMessageOutput>;
  sendMessage(input: SendMessageInput, ctx: UserContext): Promise<SendMessageOutput>;
  markRead(input: MessageActionInput, ctx: UserContext): Promise<ActionResult>;
  markUnread(input: MessageActionInput, ctx: UserContext): Promise<ActionResult>;
  archiveMessage(input: MessageActionInput, ctx: UserContext): Promise<ActionResult>;
}
```

Then implement:
- `YahooAppPasswordProvider`
- `YahooOAuthProvider` later

## 7. Data model for messages

Use your own normalized shape:

```json
{
  "id": "provider-specific-id",
  "threadId": "optional-thread-id",
  "folder": "INBOX",
  "subject": "Quarterly update",
  "from": [{"name": "Alice", "email": "alice@example.com"}],
  "to": [{"name": "Bob", "email": "bob@example.com"}],
  "date": "2026-03-08T09:30:00Z",
  "snippet": "First 200 chars...",
  "textBody": "...",
  "htmlBody": "...",
  "flags": {
    "seen": true,
    "flagged": false,
    "answered": false
  }
}
```

## 8. Security requirements

### 8.1 Secrets
- No plaintext Yahoo credentials in DB
- No plaintext in logs
- Decrypt only inside mailbox adapter
- Use secret scanning in CI

### 8.2 HTTP security
- TLS everywhere
- validate `Origin`
- CSRF protection for browser-based connect flows
- secure session cookies if browser sessions used

### 8.3 Content handling
- sanitize HTML bodies
- strip scripts and risky markup
- truncate large content
- do not render remote images automatically

### 8.4 Action safety
- `archive_message` allowed in V1
- `delete_message` not exposed in V1
- any future destructive action requires extra confirmation semantics

### 8.5 Compliance posture
Build the app and docs to reflect privacy, disclosure, and least-privilege handling expectations from day one.

## 9. Deployment architecture

### Minimal production topology
- 1 web/API/MCP service
- 1 Postgres instance
- 1 Redis instance
- optional worker process

### Recommended runtime
- containerized Node app
- reverse proxy
- autoscaling later if needed

### Environments
- local
- staging
- production

## 10. Local development plan

Use:
- Docker Compose for Postgres + Redis
- local Node server for app + MCP
- ngrok or localhost HTTPS only if testing Yahoo OAuth flows later

## 11. Testing strategy

### 11.1 Unit tests
- schema validation
- mailbox adapter mapping
- encryption/decryption
- auth middleware
- rate limiter

### 11.2 Integration tests
- IMAP login with test account
- SMTP send with sandbox/test mailbox
- MCP tool invocation end-to-end
- DB persistence and audit logging

### 11.3 MCP validation
Use MCP Inspector to test the server locally.

### 11.4 Security testing
- secret redaction tests
- malformed HTML mail tests
- origin validation tests
- auth bypass tests
- rate-limit abuse tests

## 12. Observability

### Logging
Structured logs with:
- request_id
- user_id
- tool_name
- duration_ms
- upstream_status

### Metrics
- tool calls per minute
- tool success rate
- IMAP connection failures
- SMTP failures
- search latency
- auth failures

### Tracing
OpenTelemetry spans:
- MCP request
- auth resolution
- credential decrypt
- IMAP/SMTP call
- DB write

## 13. Error model

Standardize these codes:
- `UNAUTHORIZED`
- `FORBIDDEN`
- `CONNECTION_NOT_FOUND`
- `YAHOO_AUTH_FAILED`
- `YAHOO_IMAP_ERROR`
- `YAHOO_SMTP_ERROR`
- `RATE_LIMITED`
- `VALIDATION_ERROR`
- `INTERNAL_ERROR`

## 14. Implementation phases

### Phase 0 — Foundations
- monorepo setup
- auth
- DB schema
- encryption utility
- health endpoint
- CI/CD

### Phase 1 — Yahoo app-password MVP
- connect Yahoo mailbox
- IMAP read/search/list
- SMTP send
- remote MCP endpoint
- `list_messages`, `search_messages`, `read_message`, `send_message`

### Phase 2 — Safe mailbox actions
- mark read/unread
- archive
- audit logs
- rate limiting
- HTML sanitization
- admin metrics

### Phase 3 — Production hardening
- worker queue
- retries
- tracing
- stronger session handling
- deployment automation

### Phase 4 — Yahoo OAuth path
- provider registration
- OAuth authorization code flow
- token storage
- feature flag for approved accounts only

## 15. Suggested repo structure

```text
ymail-mcp-cloud/
  apps/
    api/
    worker/
    web/
  packages/
    mcp-server/
    mailbox-core/
    provider-yahoo/
    security/
    db/
    observability/
    shared-types/
  infra/
    docker/
    terraform/
  docs/
    PRD.md
    TRD.md
    ADRs/
```

## 16. ADRs you should write

Create short Architecture Decision Records for:
- why TypeScript
- why Streamable HTTP
- why app-password MVP before OAuth
- why no delete in V1
- why provider abstraction
- why envelope encryption
- why Postgres + Redis
