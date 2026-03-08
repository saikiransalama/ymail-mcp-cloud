# ADR 007 — PostgreSQL + Redis Infrastructure

## Status
Accepted

## Context
The system requires persistent storage for users, connections, and audit logs, plus fast ephemeral storage for rate limiting and job queues.

## Decision
Use PostgreSQL 16 for relational data and Redis 7 for rate limiting state and BullMQ job queues.

## Rationale

### PostgreSQL
- Mature, reliable, ACID-compliant relational database
- Native UUID support (`gen_random_uuid()`)
- `pgcrypto` functions available if needed for server-side crypto in future
- Excellent ecosystem support (Drizzle ORM, pg client, pgAdmin)
- Strong JSONB support for future metadata needs
- Hosting options: Railway, Supabase, Neon, AWS RDS, Fly.io Postgres

### Redis
- Industry standard for sliding window rate limiting (sorted sets)
- Required by BullMQ for job queue persistence
- Sub-millisecond latency for rate limit checks on every MCP request
- Atomic operations via Lua scripts (used in rate limit sliding window)
- Hosting options: Railway, Upstash, AWS ElastiCache, Fly.io Redis

## Drizzle ORM
Chosen over Prisma because:
- No binary engine — pure TypeScript, no platform-specific downloads
- Schema as TypeScript code (vs Prisma schema language)
- Better monorepo compatibility
- Lighter footprint in production containers

## Consequences
- Two infrastructure dependencies to manage (Postgres + Redis)
- Must run both services in Docker Compose for local dev
- Redis is a soft dependency for rate limiting — can degrade gracefully if unavailable (rate limit skipped, warning logged)
- Postgres schema migrations must run before server startup (handled by `migrate.ts`)
