import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerHealthRoutes } from "./routes/health.js";
import { registerMeRoutes } from "./routes/me.js";
import { registerPatternRoutes } from "./routes/patterns.js";
import { registerPreferenceRoutes } from "./routes/preferences.js";
import { registerWorldRoutes } from "./routes/worlds.js";
import { loadEnv } from "../infrastructure/config/env.js";
import { logError, logInfo } from "../infrastructure/logger/logger.js";
import { HttpError, isHttpError } from "../shared/errors/httpError.js";

export function createApp() {
  const env = loadEnv();
  const app = Fastify({
    logger: false,
    genReqId: () => globalThis.crypto.randomUUID(),
  });

  app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
  });

  app.addHook("onRequest", async (request) => {
    logInfo("request.start", {
      method: request.method,
      url: request.url,
      requestId: request.id,
    });
  });

  app.addHook("onResponse", async (request, reply) => {
    logInfo("request.end", {
      method: request.method,
      url: request.url,
      requestId: request.id,
      statusCode: reply.statusCode,
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const normalized = isHttpError(error)
      ? error
      : error instanceof HttpError
        ? error
        : new HttpError(500, "INTERNAL_SERVER_ERROR", "Unexpected server error.");

    logError("request.error", {
      method: request.method,
      url: request.url,
      requestId: request.id,
      statusCode: normalized.statusCode,
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
      stack: error instanceof Error ? error.stack : undefined,
    });

    reply.status(normalized.statusCode).send({
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
      requestId: request.id,
    });
  });

  app.register(registerHealthRoutes);
  app.register(registerMeRoutes);
  app.register(registerWorldRoutes);
  app.register(registerPatternRoutes);
  app.register(registerPreferenceRoutes);

  return app;
}
