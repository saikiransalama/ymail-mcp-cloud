import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { createDbClient } from "@ymail-mcp/db";

export default fp(async function postgresPlugin(app: FastifyInstance) {
  const db = createDbClient(app.config.DATABASE_URL);
  app.decorate("db", db);
  app.log.info("PostgreSQL connected");
});
