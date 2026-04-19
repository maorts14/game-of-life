import type { FastifyInstance } from "fastify";
import { authenticateRequest } from "../auth.js";
import { parseWithSchema, requireAuth } from "../helpers.js";
import { createPatternSchema, listPatternsQuerySchema, patternIdParamsSchema } from "../schemas/patternSchemas.js";
import { PatternService } from "../../application/services/PatternService.js";
import { createUserScopedSupabaseClient } from "../../infrastructure/supabase/clientFactory.js";
import { SupabasePatternRepository } from "../../infrastructure/supabase/SupabasePatternRepository.js";

function buildPatternService(token: string) {
  const client = createUserScopedSupabaseClient(token);
  return new PatternService(new SupabasePatternRepository(client));
}

export async function registerPatternRoutes(app: FastifyInstance) {
  app.get("/patterns", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const query = parseWithSchema(listPatternsQuerySchema, request.query);
    const service = buildPatternService(auth.token);
    return query.scope === "builtin" ? service.listBuiltinPatterns() : service.listMyPatterns();
  });

  app.post("/patterns", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const body = parseWithSchema(createPatternSchema, request.body);
    return buildPatternService(auth.token).createPattern(body);
  });

  app.delete("/patterns/:id", { preHandler: authenticateRequest }, async (request, reply) => {
    const auth = requireAuth(request);
    const params = parseWithSchema(patternIdParamsSchema, request.params);
    await buildPatternService(auth.token).deletePattern(params.id);
    reply.status(204).send();
  });
}
