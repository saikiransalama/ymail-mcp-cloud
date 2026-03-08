# ADR 004 — No delete_message in V1

## Status
Accepted

## Context
Email deletion is irreversible (unless the provider implements soft-delete with a Trash folder). Exposing this action via an AI-controlled MCP tool carries high risk of accidental or adversarial data loss.

## Decision
The `delete_message` tool is explicitly not exposed in V1. Archive is the most destructive action available.

## Rationale
- Deletion is irreversible at the Yahoo IMAP level after `EXPUNGE`
- AI agents operating over email should not have deletion capability without explicit human confirmation semantics
- `archive_message` (move to Archive folder) covers the legitimate use case of removing messages from INBOX
- The MCP spec does not yet have a standard "confirmation required" tool pattern — implementing one correctly is complex
- Omitting deletion follows the principle of least privilege

## Future Consideration (V1.1+)
If delete is required in future:
1. Implement as a two-step process: `request_delete` returns a confirmation token, `confirm_delete` takes the token
2. Add a `require_confirmation: true` flag to the tool schema
3. Log all delete actions with before/after state for auditability
4. Add a rate limit of 1 delete per minute

## Consequences
- Users cannot permanently delete messages via MCP (acceptable — they can still use Yahoo Mail directly)
- Simplifies audit log requirements (archive actions are still logged)
- Reduces liability and security surface area
