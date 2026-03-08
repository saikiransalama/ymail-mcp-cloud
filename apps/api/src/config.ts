import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://ymail:ymail_dev_pw@localhost:5432/ymail_mcp"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for security"),
  MASTER_KEY: z
    .string()
    .length(64, "MASTER_KEY must be exactly 64 hex characters (32 bytes)")
    .regex(/^[0-9a-f]+$/i, "MASTER_KEY must be hex-encoded"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  RATE_LIMIT_MCP_RPM: z.coerce.number().default(60),
  RATE_LIMIT_SEND_RPM: z.coerce.number().default(10),
  MCP_SERVER_NAME: z.string().default("ymail-mcp-cloud"),
  MCP_SERVER_VERSION: z.string().default("1.0.0"),
});

export type Config = z.infer<typeof configSchema>;

let _config: Config | null = null;

export function loadConfig(): Config {
  if (_config) return _config;

  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid configuration:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  _config = result.data;
  return _config;
}
