# ADR 003 — App Password MVP Before Yahoo OAuth

## Status
Accepted

## Context
Yahoo Mail supports two access modes for third-party apps:
1. App passwords (IMAP/SMTP with app-specific password) — immediately available
2. OAuth 2.0 with restricted mail scopes — requires Yahoo developer application approval

## Decision
Implement V1 using Yahoo app passwords only. Design the codebase to support OAuth in V1.1.

## Rationale
- App passwords are immediately usable without waiting for Yahoo's approval process
- Allows us to build and showcase a fully working system now
- The provider abstraction (`MailProvider` interface) was designed from day one to support both backends
- `YahooOAuthProvider` stub is already scaffolded, with clear `NOT_IMPLEMENTED` errors
- The credential storage schema (`auth_mode` column) already supports `oauth` mode

## Migration Path (V1.1)
When Yahoo grants restricted-scope OAuth access:
1. Register Yahoo developer app with mail scopes
2. Implement OAuth authorization code flow in `apps/api/src/routes/oauth/`
3. Implement `YahooOAuthProvider` using XOAUTH2 for IMAP authentication
4. Store OAuth tokens (access + refresh) in the same `mail_connections.encrypted_secret_blob`
5. Gate with `FEATURE_OAUTH_ENABLED=true` environment flag

## Consequences
- Users must create and manage Yahoo app passwords (extra friction vs OAuth)
- We need clear documentation on how to create Yahoo app passwords
- App passwords are not scoped — they grant full account access (vs OAuth's scope limitations)
- This is acceptable for a developer/portfolio demo; document the limitation clearly
