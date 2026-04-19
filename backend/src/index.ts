import "node:process";
import { createApp } from "./api/app.js";
import { loadEnv } from "./infrastructure/config/env.js";
import { logInfo } from "./infrastructure/logger/logger.js";

const env = loadEnv();
const app = createApp();

app
  .listen({
    host: env.apiHost,
    port: env.port,
  })
  .then((address) => {
    logInfo("server.started", {
      address,
      appEnv: env.appEnv,
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
