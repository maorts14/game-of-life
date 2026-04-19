import type { FastifyInstance } from "fastify";
import { authenticateRequest } from "../auth.js";
import { parseWithSchema, requireAuth } from "../helpers.js";
import {
  applyPatternSchema,
  createWorldSchema,
  patchCellsSchema,
  renameWorldSchema,
  versionedMutationSchema,
  worldIdParamsSchema,
} from "../schemas/worldSchemas.js";
import { WorldService } from "../../application/services/WorldService.js";
import { createUserScopedSupabaseClient } from "../../infrastructure/supabase/clientFactory.js";
import { SupabasePatternRepository } from "../../infrastructure/supabase/SupabasePatternRepository.js";
import { SupabaseWorldRepository } from "../../infrastructure/supabase/SupabaseWorldRepository.js";
import { createEmptyGrid } from "../../../../shared/src/game/engine.js";

function buildWorldService(token: string) {
  const client = createUserScopedSupabaseClient(token);
  return new WorldService(
    new SupabaseWorldRepository(client),
    new SupabasePatternRepository(client),
  );
}

export async function registerWorldRoutes(app: FastifyInstance) {
  app.get("/worlds", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    return buildWorldService(auth.token).listWorlds();
  });

  app.post("/worlds", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const body = parseWithSchema(createWorldSchema, request.body);
    return buildWorldService(auth.token).createImportedWorld({
      name: body.name,
      width: body.width,
      height: body.height,
      grid: body.grid ?? createEmptyGrid(body.width, body.height),
      generation: body.generation ?? 0,
    });
  });

  app.get("/worlds/:id", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const params = parseWithSchema(worldIdParamsSchema, request.params);
    return buildWorldService(auth.token).getWorld(params.id);
  });

  app.patch("/worlds/:id", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const params = parseWithSchema(worldIdParamsSchema, request.params);
    const body = parseWithSchema(renameWorldSchema, request.body);
    return buildWorldService(auth.token).renameWorld(params.id, body.name);
  });

  app.delete("/worlds/:id", { preHandler: authenticateRequest }, async (request, reply) => {
    const auth = requireAuth(request);
    const params = parseWithSchema(worldIdParamsSchema, request.params);
    await buildWorldService(auth.token).deleteWorld(params.id);
    reply.status(204).send();
  });

  app.patch("/worlds/:id/cells", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const params = parseWithSchema(worldIdParamsSchema, request.params);
    const body = parseWithSchema(patchCellsSchema, request.body);
    return buildWorldService(auth.token).patchCells(params.id, body);
  });

  app.post("/worlds/:id/step", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const params = parseWithSchema(worldIdParamsSchema, request.params);
    const body = parseWithSchema(versionedMutationSchema, request.body);
    return buildWorldService(auth.token).stepWorld(params.id, body.expectedVersion);
  });

  app.post("/worlds/:id/randomize", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const params = parseWithSchema(worldIdParamsSchema, request.params);
    const body = parseWithSchema(versionedMutationSchema, request.body);
    return buildWorldService(auth.token).randomizeWorld(params.id, body.expectedVersion);
  });

  app.post("/worlds/:id/clear", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const params = parseWithSchema(worldIdParamsSchema, request.params);
    const body = parseWithSchema(versionedMutationSchema, request.body);
    return buildWorldService(auth.token).clearWorld(params.id, body.expectedVersion);
  });

  app.post("/worlds/:id/pattern-applications", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const params = parseWithSchema(worldIdParamsSchema, request.params);
    const body = parseWithSchema(applyPatternSchema, request.body);
    return buildWorldService(auth.token).applyPattern(params.id, body);
  });
}
