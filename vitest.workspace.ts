import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/shared-types",
  "packages/security",
  "packages/observability",
  "packages/mailbox-core",
  "packages/provider-yahoo",
  "packages/mcp-server",
  "apps/api",
  "apps/worker",
]);
