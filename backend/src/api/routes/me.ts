import type { FastifyInstance } from "fastify";
import { authenticateRequest } from "../auth.js";
import { requireAuth } from "../helpers.js";

export async function registerMeRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);

    return {
      id: auth.userId,
      email: auth.email,
    };
  });
}
