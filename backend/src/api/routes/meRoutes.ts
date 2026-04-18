import type { FastifyInstance } from "fastify";
import type { AppDependencies } from "../types.js";

export async function meRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.get(
    "/api/me",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request) => ({
      user: request.auth!.user,
    }),
  );
}
