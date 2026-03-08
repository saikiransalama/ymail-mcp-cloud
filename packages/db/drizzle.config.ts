import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./dist/schema/users.js",
    "./dist/schema/mail-connections.js",
    "./dist/schema/mcp-audit-logs.js",
  ],
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://ymail:ymail_dev_pw@localhost:5432/ymail_mcp",
  },
  verbose: true,
  strict: true,
});
