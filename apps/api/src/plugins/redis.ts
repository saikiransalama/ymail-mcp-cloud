import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { Redis } from "ioredis";

export default fp(async function redisPlugin(app: FastifyInstance) {
  const redis = new Redis(app.config.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: 3,
  });

  redis.on("error", (err: Error) => {
    app.log.error({ err }, "Redis connection error");
  });

  redis.on("connect", () => {
    app.log.info("Redis connected");
  });

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    await redis.quit();
  });
});
