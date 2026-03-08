# ADR 002 — Streamable HTTP as MCP Transport

## Status
Accepted

## Context
The MCP specification supports multiple transports. Remote MCP servers must use HTTP-based transport. We needed to choose the transport mechanism.

## Decision
Use the Streamable HTTP transport from `@modelcontextprotocol/sdk` on `GET|POST /mcp`.

## Rationale
- Streamable HTTP is the recommended transport for remote, multi-user MCP servers per the MCP spec
- It supports both request/response (JSON-RPC POST) and streaming (SSE GET) patterns
- Works with standard HTTP infrastructure (reverse proxies, load balancers)
- The MCP TypeScript SDK provides `StreamableHTTPServerTransport` out of the box
- Authorization is cleanly handled via HTTP headers (Bearer token)

## Implementation Detail
We use a per-request McpServer + Transport pattern (stateless):
1. Each HTTP request to `/mcp` creates a new `McpServer` and `StreamableHTTPServerTransport`
2. User context is resolved from the bearer token before transport handling
3. `reply.hijack()` prevents Fastify from sending its own response while the MCP SDK writes to `reply.raw`

## Alternatives Considered
- stdio transport — only suitable for local/CLI use, not remote multi-user
- WebSocket transport — more complex, overkill for current use case
- Custom JSON-RPC over REST — would not be MCP-compatible

## Consequences
- MCP clients must send `Authorization: Bearer <token>` with every request
- SSE sessions are not persisted across server restarts (acceptable for V1)
- Per-request server creation has slight overhead but guarantees isolation
