# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev                          # Start all apps in parallel (API :3001, web :3000, worker)
pnpm build                        # Full monorepo build via turbo
pnpm test                         # Run all tests via turbo
pnpm typecheck                    # Type-check all packages
```

### Targeting a single package
```bash
pnpm --filter @ymail-mcp/security build
pnpm --filter @ymail-mcp/security test
pnpm --filter @ymail-mcp/api dev
```

### Running a single test file
```bash
cd packages/security && pnpm exec vitest run src/__tests__/encryption.test.ts
```

### Database
```bash
pnpm migrate            # Run pending migrations (requires DATABASE_URL)
pnpm migrate:generate   # Generate new migration from schema changes
pnpm migrate:push       # Push schema directly (dev only, no migration file)
```

### Docker infrastructure
```bash
docker compose up -d postgres redis   # Start only DB + Redis
docker compose up --build             # Start all services with Docker
```

## Architecture

### Package Dependency Graph (strict, no cycles)
```
shared-types  (leaf — no internal deps)
    ↓
security, observability, db
    ↓
mailbox-core
    ↓
provider-yahoo
    ↓
mcp-server
    ↓
apps/api, apps/worker
```

`apps/web` has no internal package dependencies — REST API only.

### Request Flow: MCP Tool Call

```
MCP client (Claude Desktop / MCP Inspector)
  → POST /mcp  (Bearer <JWT>)
  → apps/api/src/routes/mcp/index.ts
      reply.hijack()  ← prevents Fastify from writing its own response
  → packages/mcp-server/src/server.ts: handleMcpRequest()
      resolveUserContext()  ← JWT → userId → DB → decrypt creds → UserContext
      new McpServer + StreamableHTTPServerTransport (per-request, stateless)
      registerAllTools()
      transport.handleRequest(req.raw, res.raw, body)
  → packages/mcp-server/src/tools/<tool>.ts
      withAuditLog() wrapping withRateLimit() wrapping provider method
  → packages/provider-yahoo/src/yahoo-app-password-provider.ts
      withImap(userId, credentials, fn)  ← acquires async-mutex before IMAP call
```

### Credential Encryption Flow

Yahoo credentials are stored as three DB columns: `encrypted_secret_blob`, `iv`, `auth_tag`.

- **Encrypt**: `packages/security/src/encryption.ts` → AES-256-GCM, random 12-byte IV per call, MASTER_KEY from env (64-char hex)
- **Stored JSON shape**: `{ "email": "user@yahoo.com", "appPassword": "xxxx-xxxx-xxxx-xxxx" }`
- **Decrypt**: Only happens in `packages/mcp-server/src/context.ts:resolveUserContext()`, never persisted past the request

### IMAP Connection Pool

`packages/provider-yahoo/src/imap-client.ts` maintains a `Map<userId, { client: ImapFlow, mutex: Mutex }>`. Key rules:
- Always call `withImap(userId, credentials, fn)` — never use `getImapEntry` directly
- The mutex ensures imapflow is never used concurrently on the same connection
- Idle connections (5-min default) are evicted; pool max is 50

### MCP Server Pattern

Each `/mcp` request creates a **fresh** `McpServer` + `StreamableHTTPServerTransport` (stateless). Session ID generation is disabled (`sessionIdGenerator: undefined`). This means no server-side session state — all context comes from the JWT on every request.

### Adding a New MCP Tool

1. Add Zod input/output schemas to `packages/shared-types/src/tools/<tool-name>.ts`
2. Add the tool handler to `packages/mcp-server/src/tools/<tool-name>.ts` — follow the `withAuditLog` + `withRateLimit` + provider call pattern
3. Register it in `packages/mcp-server/src/tool-registry.ts`
4. Add the corresponding method to the `MailProvider` interface in `packages/mailbox-core/src/provider.ts`
5. Implement it in `packages/provider-yahoo/src/yahoo-app-password-provider.ts`

### ioredis Import Rule

Always use the **named export**: `import { Redis } from "ioredis"` (not `import Redis from "ioredis"`). The default namespace import causes TypeScript errors with NodeNext module resolution.

BullMQ (worker) has a hard dependency on ioredis 5.9.3; to avoid type conflicts, pass `{ url: redisUrl }` connection config to BullMQ `Queue`/`Worker` constructors instead of passing a `Redis` instance.

### Drizzle Migration Workflow

`drizzle.config.ts` points at **compiled** `dist/schema/*.js` files (not TypeScript source) because drizzle-kit runs as CJS and can't resolve `.js`-extension re-exports in TypeScript source. Always `pnpm build` the `db` package before running `migrate:generate`.

### Error Handling

All errors flow through `AppError` (`packages/shared-types/src/errors.ts`) with a typed `ErrorCode`. The error handler in `apps/api/src/middleware/error-handler.ts` maps `ErrorCode → HTTP status` using `HTTP_STATUS_MAP`. MCP tool errors are normalized by `packages/mcp-server/src/errors.ts`.

### Key Environment Variables

| Variable | Notes |
|---|---|
| `MASTER_KEY` | 64-char hex (32 bytes). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_SECRET` | ≥32 chars. Same token used for REST API and MCP bearer auth. |
| `DATABASE_URL` | PostgreSQL. Default in docker-compose: `postgresql://ymail:ymail_dev_pw@localhost:5432/ymail_mcp` |
| `REDIS_URL` | Default: `redis://localhost:6379` |

### Test Locations

Tests live in `src/__tests__/` inside each package. Packages without tests use `passWithNoTests: true` in their `vitest.config.ts`. The `pnpm test` turbo pipeline runs `build` first — all packages must compile before tests run.
