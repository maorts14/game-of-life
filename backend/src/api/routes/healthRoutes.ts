import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health/live", async () => ({ status: "ok" }));
  app.get("/api/health/ready", async () => ({ status: "ready" }));
}
