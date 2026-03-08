# YMail MCP Cloud

A production-style, multi-user remote MCP server for Yahoo Mail. Connect any MCP-compatible client (Claude Desktop, MCP Inspector) to your Yahoo inbox using secure app-password authentication.

## Features

- **8 MCP tools**: `list_folders`, `list_messages`, `search_messages`, `read_message`, `send_message`, `mark_read`, `mark_unread`, `archive_message`
- **Multi-user**: JWT-based auth; each user connects their own Yahoo account
- **Secure credential storage**: AES-256-GCM envelope encryption — Yahoo app passwords never stored in plaintext
- **HTML sanitization**: XSS-safe email body rendering via strict allowlist
- **Rate limiting**: Per-user sliding window (60 req/min general, 10/min for send)
- **Audit logs**: Every MCP tool call recorded with duration and status
- **Background health checks**: BullMQ worker pings all IMAP connections every 15 min
- **TypeScript monorepo**: pnpm workspaces + Turbo build pipeline

## Architecture

```
apps/
  api/        Fastify: REST auth/connections + /mcp endpoint
  worker/     BullMQ: connection health checks every 15 min
  web/        Vite+React: Register, Login, Dashboard, Connect Yahoo
packages/
  shared-types/    Zod schemas + TypeScript types
  db/              Drizzle ORM schema, migrations, query helpers
  security/        AES-256-GCM encryption, JWT, argon2id, redaction
  observability/   pino logger with field redaction, OTEL tracer stub
  mailbox-core/    MailProvider interface, HTML sanitizer, body truncator
  provider-yahoo/  IMAP (imapflow) + SMTP (nodemailer) implementation
  mcp-server/      MCP SDK server, 8 tools, audit middleware, rate limits
```

## Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9
- Docker + Docker Compose

## 15-Minute Quickstart

**1. Clone and configure**

```bash
git clone <repo-url> ymail-mcp-cloud
cd ymail-mcp-cloud
cp .env.example .env
```

Edit `.env` — the two values you must set:

```env
# Generate a 64-char hex key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
MASTER_KEY=<64-char-hex>

# Generate a 32+ char secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<32+-char-secret>
```

**2. Start PostgreSQL and Redis**

```bash
docker compose up -d postgres redis
```

**3. Install dependencies and run migrations**

```bash
pnpm install
pnpm migrate
```

**4. Start all services**

```bash
pnpm dev
```

This starts:
- API server at `http://localhost:3001`
- Web UI at `http://localhost:3000`
- Worker process (BullMQ connection health)

**5. Register and connect Yahoo**

Open `http://localhost:3000` in your browser:

1. Click **Register** → create an account
2. Click **Connect Yahoo** → enter your Yahoo email + [app password](https://help.yahoo.com/kb/generate-third-party-passwords-sln15241.html)
3. Copy the JWT token from the Dashboard

> **Yahoo App Password**: Go to Yahoo Account Security → Generate app password → Select "Other app" → Copy the 16-character password.

**6. Connect MCP Inspector**

Open [MCP Inspector](https://github.com/modelcontextprotocol/inspector) and connect to:

```
URL:   http://localhost:3001/mcp
Auth:  Bearer <your-jwt-token>
```

**7. Try the tools**

```
list_folders          → see your Yahoo mailboxes
list_messages         folder=INBOX limit=10
search_messages       query="invoice"
read_message          message_id=<id>
send_message          to=[{email:"you@example.com"}] subject="Test" textBody="Hello"
mark_read             message_id=<id>
archive_message       message_id=<id>
```

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ymail": {
      "url": "http://localhost:3001/mcp",
      "headers": {
        "Authorization": "Bearer <your-jwt-token>"
      }
    }
  }
}
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Create account → returns JWT |
| `POST` | `/auth/login` | Login → returns JWT |
| `GET` | `/me` | Current user info (auth required) |
| `POST` | `/connections/yahoo` | Store Yahoo credentials (auth required) |
| `GET` | `/connections` | List your connections (auth required) |
| `DELETE` | `/connections/yahoo/:id` | Remove connection (auth required) |
| `POST` | `/connections/yahoo/test` | Ping IMAP + SMTP (auth required) |
| `GET\|POST` | `/mcp` | MCP Streamable HTTP transport (auth required) |
| `GET` | `/health` | Health check (DB + Redis status) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `REDIS_URL` | Yes | Redis connection URL |
| `JWT_SECRET` | Yes | HS256 signing key (≥32 chars) |
| `MASTER_KEY` | Yes | AES-256 master key (64-char hex = 32 bytes) |
| `PORT` | No | API port (default: 3001) |
| `NODE_ENV` | No | `development` \| `production` \| `test` |
| `LOG_LEVEL` | No | `trace`\|`debug`\|`info`\|`warn`\|`error` (default: info) |

## Security Design

- **Credential encryption**: Yahoo app passwords are encrypted with AES-256-GCM before storage. A random 12-byte IV is generated per encrypt call. The master key never touches the database.
- **Password hashing**: argon2id (OWASP-recommended, memory-hard)
- **JWT**: HS256, 24h expiry, same token for REST API and MCP bearer auth
- **HTML sanitization**: Email HTML bodies are sanitized with a strict allowlist — no `<script>`, `<iframe>`, `<img>`, or `javascript:` URIs
- **Body truncation**: Email bodies capped at 50,000 characters
- **Log redaction**: pino redacts `password`, `token`, `secret`, `auth_tag`, `encrypted_secret_blob` from all log output
- **Rate limiting**: Redis sliding window — 60 req/min general, 10/min for `send_message`

## Running Tests

```bash
pnpm test
```

Test coverage includes:

| Package | Tests |
|---------|-------|
| `shared-types` | Zod schema validation (ListMessages, SearchMessages, SendMessage, AppError) |
| `security` | AES-256-GCM roundtrip, wrong key rejection, JWT sign/verify/expiry/tamper, redact recursion |
| `mailbox-core` | HTML sanitizer (XSS payloads), body truncator |
| `provider-yahoo` | IMAP search criteria builder, IMAP→AppError mapper |

## Known Limitations

- **No delete in V1**: `delete_message` is intentionally omitted (see ADR 004)
- **OAuth not implemented**: `YahooOAuthProvider` throws `NOT_IMPLEMENTED`; only app-password auth is supported
- **Single connection per user**: One Yahoo account per user account
- **SMTP port 465**: Some cloud providers block outbound SMTP. Check your hosting provider's egress policy before deploying.
- **No attachment download**: Attachments are detected and flagged (`hasAttachments: true`) but not downloadable via MCP tools in V1

## OAuth Migration Path

When Yahoo OAuth support is needed:

1. Implement `YahooOAuthProvider` in `packages/provider-yahoo/src/yahoo-oauth-provider.ts`
2. Add `oauth_token` + `refresh_token` fields to `mail_connections` table (new Drizzle migration)
3. Add `/auth/yahoo/oauth` callback route in `apps/api`
4. The MCP tool layer requires zero changes — it only depends on the `MailProvider` interface

## Project Structure Notes

- **No circular dependencies**: `shared-types` is the only universal leaf; all others depend on it
- **Per-request McpServer**: Each `/mcp` request creates a fresh `McpServer` + `StreamableHTTPServerTransport` (stateless, fully isolated per user)
- **IMAP concurrency safety**: `async-mutex` per user connection in the imapflow pool (imapflow is not concurrency-safe)
- **ADRs**: See `docs/ADRs/` for architectural decision records

## Docker Production Build

```bash
# Build and start all services
docker compose up --build

# Or build images individually
docker build -f infra/docker/Dockerfile.api -t ymail-api .
docker build -f infra/docker/Dockerfile.worker -t ymail-worker .
```
