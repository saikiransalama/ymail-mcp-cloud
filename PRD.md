# PRD — Yahoo Mail MCP Server (Multi-User, Remote)

## 1. Product name

**YMail MCP Cloud**  
A remote, multi-user MCP server that lets AI clients securely read, search, summarize, and send Yahoo Mail on behalf of individual users.

## 2. Product summary

YMail MCP Cloud is a hosted MCP server built for modern AI hosts and coding agents. Users connect their Yahoo Mail account, authorize access, and then use any MCP-compatible host to search inboxes, read messages, draft replies, send mail, and organize messages. The first release should prioritize safe read/search/send workflows, with destructive actions tightly gated.

## 3. Problem statement

There is no widely trusted, polished Yahoo Mail MCP server that is both:

- multi-user
- remotely deployable
- secure enough to showcase publicly
- architected for future production use

Developers who want Yahoo Mail inside MCP workflows currently need to piece together IMAP/SMTP logic, user auth, secrets handling, and MCP transport/security on their own.

## 4. Goals

### Primary goals
- Build a remote multi-user MCP server using Streamable HTTP
- Support per-user Yahoo account connection
- Expose a high-quality MCP toolset for email workflows
- Be strong enough to showcase on GitHub and in a resume/portfolio
- Be structured so it can later move from app-password mode to Yahoo-approved OAuth mode without major rewrites

### Secondary goals
- Add observability, auditability, and rate limiting
- Make the project look production-minded, not just a toy demo
- Provide clear local dev and cloud deployment paths

## 5. Non-goals for V1

- Full Gmail/Outlook parity
- Calendar or contacts support
- Attachment upload/download in V1
- Thread mutation beyond basic labels/read/archive
- Enterprise SSO for your own app
- End-user billing

## 6. User personas

### Persona A — AI power user
A developer or founder who wants to connect Yahoo Mail to Claude Desktop, Claude Code, or another MCP client to search inboxes and send email.

### Persona B — Technical evaluator
A recruiter, hiring manager, or open-source user reviewing the project as a portfolio artifact.

### Persona C — Early adopter
A small set of users who want a hosted, working Yahoo Mail MCP service.

## 7. User stories

### Connection and onboarding
- As a user, I want to connect my Yahoo Mail account so the MCP server can act on my behalf.
- As a user, I want a secure onboarding flow with clear permissions and disclosures.
- As a user, I want to disconnect my account and delete my credentials.

### Email workflows
- As a user, I want to list recent inbox emails.
- As a user, I want to search emails by sender, subject, unread status, and date.
- As a user, I want to read a specific email.
- As a user, I want the AI host to summarize important messages.
- As a user, I want to draft and send mail.
- As a user, I want to mark messages read/unread and archive them.

### Trust and control
- As a user, I want destructive actions to be clearly gated.
- As a user, I want my email content handled securely.
- As an operator, I want audit logs and rate limits.

## 8. Product constraints

### Yahoo platform constraint
Yahoo officially supports third-party email access via IMAP/SMTP and app passwords for third-party email apps. For commercial/developer access to restricted mail scopes with OAuth2, those scopes are not self-serve and require application/review.

### MCP constraint
Remote MCP servers should use HTTP-based transport, and for sensitive user data like email they should implement strong authorization.

## 9. Product strategy

### 9.1 Release strategy

#### V1A — Showcase MVP
Users connect Yahoo Mail using:
- Yahoo email address
- Yahoo app password

This is the fastest realistic path for a public portfolio project.

#### V1B — Future approved mode
If Yahoo grants restricted-scope access, add:
- Yahoo OAuth authorization code flow
- per-user token storage
- OAuth-based IMAP/SMTP auth

### 9.2 Positioning

This project should be positioned as:

> A production-style, multi-user remote MCP server for Yahoo Mail with a secure credential architecture, transport/auth compliance, observability, and a migration path from app-password connectivity to provider-approved OAuth.

## 10. Feature requirements

### 10.1 User-facing account features
- Sign up / sign in to your app
- Connect Yahoo Mail account
- Store encrypted credentials
- Disconnect account
- View connection status
- Delete account data

### 10.2 MCP server features

Expose tools for:
- `list_folders`
- `list_messages`
- `search_messages`
- `read_message`
- `send_message`
- `draft_message`
- `mark_read`
- `mark_unread`
- `archive_message`

Optional V1.1:
- `get_thread`
- `move_message`
- `list_unread`
- `summarize_folder`

### 10.3 Admin/operator features
- Health endpoint
- Structured logging
- Request tracing
- Per-user rate limiting
- Audit log for actions
- Admin dashboard or simple log viewer
- Secrets rotation support

### 10.4 Safety requirements
- No delete in V1
- No bulk destructive actions in V1
- Tool descriptions must warn when an action changes mailbox state
- Default body truncation for large emails
- HTML sanitization before returning content
- Attachment access disabled by default

## 11. Functional requirements

### FR-1: Multi-user account model
The system must support many users, each with isolated credentials, mailbox actions, logs, and rate limits.

### FR-2: Hosted MCP endpoint
The system must provide a single remote MCP endpoint over HTTP compatible with Streamable HTTP.

### FR-3: Authorization
The system must require app-level auth before a user can invoke mailbox tools.

### FR-4: Yahoo mailbox connectivity
The system must use Yahoo IMAP for read/search and Yahoo SMTP for sending.

### FR-5: Secure credential storage
The system must encrypt stored Yahoo credentials at rest.

### FR-6: Auditability
The system must record who invoked which mailbox tool and when, without logging sensitive message bodies by default.

### FR-7: Error transparency
The system must distinguish:
- auth failure
- Yahoo credential failure
- mailbox connectivity failure
- rate limit / temporary upstream failure
- invalid tool parameters

## 12. Non-functional requirements

### Security
- Encrypt per-user credentials with envelope encryption
- Secrets never logged
- Separate app auth from mailbox auth
- Origin validation on HTTP transport
- TLS in production

### Scalability
- Support at least 100 concurrent connected users in showcase mode
- Stateless app tier where possible
- Background queue for slow operations
- Connection pooling or bounded IMAP concurrency

### Reliability
- 99.5% uptime target for hosted showcase
- Retries for transient SMTP/IMAP failures
- Timeouts for all upstream actions

### Maintainability
- Modular adapters
- Provider abstraction layer
- Test coverage for core flows
- CI for lint/test/build

## 13. Success metrics

### Product metrics
- Users who successfully connect Yahoo account
- Weekly active connected users
- Tool success rate
- Read/search/send task completion rate

### Technical metrics
- P95 latency for `list_messages`
- P95 latency for `search_messages`
- SMTP success rate
- IMAP auth failure rate
- Token/credential decryption failure rate
- MCP call error rate

### Portfolio metrics
- GitHub stars/forks
- Demo video completion
- Reproducible setup within 15 minutes

## 14. Risks

### Risk 1 — Yahoo restricted OAuth access
A fully polished OAuth-based production integration may be blocked until Yahoo approves access.

### Risk 2 — App password friction
Some users may not know how to create Yahoo app passwords.

### Risk 3 — IMAP complexity
Email parsing, folders, flags, and threading are messy and can slow delivery.

### Risk 4 — Security expectations
Because this is email, even a showcase project needs serious security posture.

## 15. Open questions
- Will you support only Yahoo, or build a provider abstraction from day one?
- Will you host a public demo or only provide self-host instructions?
- Will you support attachments in V1.1 or later?
- Do you want your own web UI, or only API + MCP endpoint?
