# YMail MCP — Use Claude to Read and Send Your Yahoo Mail

This server connects Claude AI to your Yahoo Mail account. Once it's running, you can ask Claude things like *"show me my unread emails"*, *"find the invoice from last week"*, or *"send a quick reply to John"* — and Claude will do it directly through your Yahoo inbox.

Your Yahoo password is never stored in plain text. The server encrypts it with military-grade encryption before saving anything to disk.

---

## Before You Start

You need four things installed on your computer. Click each link to download:

| What | Why you need it | How to check if you have it |
|---|---|---|
| [Node.js 22+](https://nodejs.org) | Runs the server | `node --version` in Terminal |
| [pnpm](https://pnpm.io/installation) | Installs code dependencies | `pnpm --version` in Terminal |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Runs the database in the background | Open Docker Desktop — it should show a green light |
| [Claude Desktop](https://claude.ai/download) | The Claude app on your computer | You're probably using this already |

You also need a **Yahoo App Password** — this is a special one-time password just for this server (not your regular Yahoo password). Get one here:

1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Scroll to **"Generate app password"**
3. Select **"Other app"**, type any name (e.g. "Claude"), click **Generate**
4. Copy the 16-character password shown — you'll need it in Step 6 below

---

## Setup (Do This Once)

### Step 1 — Download the project

```bash
git clone https://github.com/saikiransalama/ymail-mcp-cloud.git
cd ymail-mcp-cloud
```

> **No git?** Download the zip from GitHub (green "Code" button → "Download ZIP"), unzip it, and open Terminal in that folder.

### Step 2 — Create your config file

```bash
cp .env.example .env
```

This creates a `.env` file where your settings will live. Now open it in any text editor.

### Step 3 — Generate your secret keys

You need two secret keys. Run each command in Terminal and copy the output into your `.env` file:

**First key (MASTER_KEY)** — encrypts your Yahoo password in the database:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Second key (JWT_SECRET)** — keeps your login session secure:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

In your `.env` file, replace the placeholder values:
```
MASTER_KEY=paste-the-first-output-here
JWT_SECRET=paste-the-second-output-here
```

> Keep this `.env` file private. Never share it or commit it to git.

### Step 4 — Start the database

```bash
docker compose up -d postgres redis
```

This starts two background services (a database and a cache). Docker Desktop must be open and running. You'll see something like `Container ymail-postgres Started`.

### Step 5 — Install dependencies

```bash
pnpm install
```

This downloads all the code libraries the server needs. It only takes a minute.

### Step 6 — Set up the database tables

```bash
pnpm migrate
```

This creates the tables where your account and encrypted credentials will be stored.

### Step 7 — Start the server

```bash
pnpm dev
```

You should see something like:
```
Server listening at http://localhost:3001
MCP endpoint: http://localhost:3001/mcp
```

**Leave this terminal window open.** The server needs to keep running while you use Claude.

---

## Connect Your Yahoo Account (Do This Once)

Open a **new** Terminal window (keep the server running in the other one).

### Step 8 — Create a login account

```bash
curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"any@email.com","password":"choose-a-password"}' | python3 -m json.tool
```

Replace `any@email.com` with any email you want to use as your username (it doesn't have to be your Yahoo email), and set a password you'll remember.

You'll get back a response with a `token` field — a long string of letters and numbers. **Copy this token.** You'll need it in the next steps.

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ...",
  "user": { "id": "...", "email": "any@email.com" }
}
```

### Step 9 — Connect your Yahoo account

```bash
curl -s -X POST http://localhost:3001/connections/yahoo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "yahooEmail": "you@yahoo.com",
    "appPassword": "xxxx-xxxx-xxxx-xxxx"
  }' | python3 -m json.tool
```

Replace:
- `YOUR_TOKEN_HERE` → the token from Step 8
- `you@yahoo.com` → your actual Yahoo email address
- `xxxx-xxxx-xxxx-xxxx` → the 16-character App Password from Yahoo (Step 2 in Prerequisites)

If it works, you'll see `"status": "active"`. Your Yahoo password is now stored encrypted — the server immediately verifies it can connect to Yahoo, then saves only the encrypted version.

---

## Connect Claude Desktop

### Step 10 — Open Claude Desktop's config file

On a Mac, open Terminal and run:
```bash
open "/Users/$USER/Library/Application Support/Claude/"
```

You'll see a folder open in Finder. Look for a file called `claude_desktop_config.json`. If it doesn't exist, create it.

### Step 11 — Add the server config

Open `claude_desktop_config.json` in a text editor and add this (replace `YOUR_TOKEN_HERE` with the token from Step 8):

```json
{
  "mcpServers": {
    "ymail": {
      "url": "http://localhost:3001/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

If the file already has other servers in it, just add the `"ymail": { ... }` block inside the existing `"mcpServers": { }` section.

### Step 12 — Restart Claude Desktop

Quit Claude Desktop completely:
- Mac: **Claude menu → Quit Claude** (or `Cmd+Q`)
- Then reopen it

### Step 13 — Verify it's working

In Claude Desktop, look for a **hammer icon (🔨)** near the message input box. Click it — you should see a list of Yahoo Mail tools:

- list_folders
- list_messages
- search_messages
- read_message
- send_message
- mark_read
- mark_unread
- archive_message

If you see these, you're all set!

---

## Things You Can Ask Claude

Once connected, just talk to Claude naturally:

| What you want | What to say |
|---|---|
| See recent emails | *"Show me my last 10 emails"* |
| Find specific emails | *"Search for emails from my boss about the project"* |
| Read an email | *"Read the email from Amazon about my order"* |
| Send an email | *"Send an email to john@example.com saying I'll be there at 3pm"* |
| Mark as unread | *"Mark that email as unread"* |
| Clean up inbox | *"Archive that email"* |
| Check folders | *"What folders do I have in my Yahoo Mail?"* |

---

## What Claude Can Do With Your Email

| Capability | What it does |
|---|---|
| **List folders** | Shows all your mailboxes (Inbox, Sent, Spam, Archive, etc.) |
| **List messages** | Shows recent emails with sender and subject — up to 100 at a time |
| **Search messages** | Finds emails by keyword, sender, subject, or date |
| **Read a message** | Opens the full email content |
| **Send a message** | Sends an email from your Yahoo account |
| **Mark as read** | Marks an email as read |
| **Mark as unread** | Marks an email as unread |
| **Archive** | Moves an email to your Archive folder |

> Note: Claude cannot delete emails — this is intentional for safety.

---

## Stopping and Starting Again

**To stop the server:**
Press `Ctrl+C` in the terminal window running `pnpm dev`.

**Next time you want to use it:**
```bash
# Step 1: Make sure Docker is running (open Docker Desktop)
# Step 2: Start the database again
docker compose up -d postgres redis

# Step 3: Start the server
cd ymail-mcp-cloud
pnpm dev
```

You don't need to run `pnpm install` or `pnpm migrate` again after the first time.

---

## Troubleshooting

**"Claude can't find the email tools / no hammer icon"**
→ Did you fully quit and reopen Claude Desktop (not just close the window)?
→ Check that the JSON in `claude_desktop_config.json` is valid — no missing commas or brackets

**"Connection failed" when connecting Yahoo**
→ Make sure you used an **App Password** from Yahoo's security settings, not your regular Yahoo login password
→ App passwords look like `abcd efgh ijkl mnop` — 16 characters, usually shown in groups of 4

**"Unauthorized" error**
→ Your login token has expired (tokens last 24 hours)
→ Run the register or login command again to get a new token, then update `claude_desktop_config.json`

To log in again (if you already registered):
```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"any@email.com","password":"your-password"}' | python3 -m json.tool
```

**"Server not found" / Claude says it can't reach the server**
→ Is the `pnpm dev` terminal still running? Check it — it may have stopped
→ Start it again: `pnpm dev`

**Docker errors**
→ Open Docker Desktop first and wait for it to show a green status light
→ Then run `docker compose up -d postgres redis` again

---

## GitHub Repository

[https://github.com/saikiransalama/ymail-mcp-cloud](https://github.com/saikiransalama/ymail-mcp-cloud)
