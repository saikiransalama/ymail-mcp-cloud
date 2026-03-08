# ADR 001 — TypeScript pnpm Monorepo

## Status
Accepted

## Context
We needed a language and project structure for a multi-component system with shared types across API, MCP server, IMAP/SMTP adapter, and web frontend.

## Decision
Use TypeScript in a pnpm workspace monorepo with Turbo for build orchestration.

## Rationale
- TypeScript provides end-to-end type safety from DB schema → API → MCP tools → client
- pnpm workspaces support internal package references (`workspace:*`) without publishing
- Turbo's dependency-aware pipeline (via `^build`) ensures packages build in correct order
- Single repository makes code review, CI, and deployment simpler for a portfolio project
- TypeScript's strict mode catches entire categories of bugs at compile time (especially useful for credential handling)

## Alternatives Considered
- JavaScript only — rejected: too many runtime type errors for a security-sensitive project
- Separate repos — rejected: too much friction for internal package sharing
- Nx — considered but Turbo is simpler and sufficient for this scale

## Consequences
- All packages must compile before dependent packages can be built
- TypeScript version must be aligned across all packages (pinned in root devDependencies)
- Node.js moduleResolution must be consistent (NodeNext throughout)
