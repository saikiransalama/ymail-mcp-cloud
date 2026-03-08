import type { DbClient } from "@ymail-mcp/db";
import type Redis from "ioredis";
import type { Config } from "../config.js";

declare module "fastify" {
  interface FastifyInstance {
    db: DbClient;
    redis: Redis;
    config: Config;
  }

  interface FastifyRequest {
    user: {
      id: string;
      email: string;
    };
    requestId: string;
  }
}
