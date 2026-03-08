import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import type { Config } from "./config.js";
import postgresPlugin from "./plugins/postgres.js";
import redisPlugin from "./plugins/redis.js";
import { registerErrorHandler } from "./middleware/error-handler.js";
import { healthRoutes } from "./routes/health/index.js";
import { registerRoute } from "./routes/auth/register.js";
import { loginRoute } from "./routes/auth/login.js";
import { meRoute } from "./routes/auth/me.js";
import { createConnectionRoute } from "./routes/connections/create.js";
import { listConnectionsRoute } from "./routes/connections/list.js";
import { deleteConnectionRoute } from "./routes/connections/delete.js";
import { testConnectionRoute } from "./routes/connections/test.js";
import { mcpRoutes } from "./routes/mcp/index.js";

export async function buildApp(config: Config) {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      ...(config.NODE_ENV === "development"
        ? {
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "HH:MM:ss",
                ignore: "pid,hostname",
              },
            },
          }
        : {}),
      redact: [
        "req.headers.authorization",
        "*.password",
        "*.appPassword",
        "*.token",
        "*.secret",
        "*.encryptedSecretBlob",
        "*.iv",
        "*.authTag",
        "*.passwordHash",
      ],
    },
    trustProxy: true,
    requestIdHeader: "x-request-id",
    genReqId: () => crypto.randomUUID(),
  });

  // Decorate with config
  app.decorate("config", config);

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: false, // Managed separately for API
  });
  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  });
  await app.register(sensible);

  // Infrastructure plugins
  await app.register(postgresPlugin);
  await app.register(redisPlugin);

  // Rate limiting (global — applied to all routes)
  await app.register(rateLimit, {
    max: 200, // 200 requests per minute per IP for REST routes
    timeWindow: "1 minute",
    skipOnError: true,
    keyGenerator: (req) => {
      // Use JWT sub if available, else IP
      const auth = req.headers.authorization;
      if (auth) {
        // Extract userId from token without full verification (just for rate limit key)
        const parts = auth.split(" ");
        if (parts[1]) {
          try {
            const payload = JSON.parse(
              Buffer.from(parts[1].split(".")[1], "base64url").toString()
            );
            if (payload.sub) return `user:${payload.sub}`;
          } catch {
            // Fall through to IP
          }
        }
      }
      return req.ip;
    },
  });

  // Error handler
  registerErrorHandler(app);

  // Routes
  await app.register(healthRoutes);
  await app.register(registerRoute);
  await app.register(loginRoute);
  await app.register(meRoute);
  await app.register(createConnectionRoute);
  await app.register(listConnectionsRoute);
  await app.register(deleteConnectionRoute);
  await app.register(testConnectionRoute);
  await app.register(mcpRoutes);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "Shutdown signal received");
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return app;
}
