import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/AppError.js";
import { authRoutes } from "./routes/authRoutes.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { meRoutes } from "./routes/meRoutes.js";
import { patternRoutes } from "./routes/patternRoutes.js";
import { preferenceRoutes } from "./routes/preferenceRoutes.js";
import { worldRoutes } from "./routes/worldRoutes.js";
import type { AppDependencies } from "./types.js";

export async function createApp(dependencies: AppDependencies) {
  const app = Fastify({
    logger: {
      level: dependencies.env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  await app.register(cookie, {
    secret: dependencies.env.COOKIE_SECRET,
    hook: "onRequest",
  });

  await app.register(cors, {
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "x-csrf-token"],
    origin: (origin, callback) => {
      if (!origin || dependencies.env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed."), false);
    },
  });

  app.addHook("onRequest", async (request) => {
    request.auth = null;
    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
      },
      "incoming request",
    );
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details ?? null,
        requestId: request.id,
      });
      return;
    }

    if (error instanceof ZodError) {
      reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: error.message,
        details: error.issues,
        requestId: request.id,
      });
      return;
    }

    request.log.error({ err: error, requestId: request.id }, "unhandled error");
    reply.status(500).send({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error.",
      details: null,
      requestId: request.id,
    });
  });

  await healthRoutes(app);
  await authRoutes(app, dependencies);
  await meRoutes(app, dependencies);
  await worldRoutes(app, dependencies);
  await patternRoutes(app, dependencies);
  await preferenceRoutes(app, dependencies);

  return app;
}
