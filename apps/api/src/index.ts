import "dotenv/config";
import { loadConfig } from "./config.js";
import { buildApp } from "./app.js";

async function main() {
  const config = loadConfig();

  const app = await buildApp(config);

  try {
    await app.listen({ port: config.PORT, host: "0.0.0.0" });
    app.log.info(`YMail MCP Cloud API running on port ${config.PORT}`);
    app.log.info(`MCP endpoint: http://localhost:${config.PORT}/mcp`);
    app.log.info(`Health check: http://localhost:${config.PORT}/health`);
  } catch (err) {
    app.log.error(err, "Failed to start server");
    process.exit(1);
  }
}

main();
