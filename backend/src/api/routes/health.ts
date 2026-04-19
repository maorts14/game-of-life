import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health/live", async () => ({
    ok: true,
    status: "live",
    now: new Date().toISOString(),
  }));

  app.get("/health/ready", async () => ({
    ok: true,
    status: "ready",
    now: new Date().toISOString(),
  }));
}
