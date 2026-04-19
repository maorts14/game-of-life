import type { FastifyInstance } from "fastify";
import { authenticateRequest } from "../auth.js";
import { parseWithSchema, requireAuth } from "../helpers.js";
import { updatePreferencesSchema } from "../schemas/preferencesSchemas.js";
import { PreferencesService } from "../../application/services/PreferencesService.js";
import { createUserScopedSupabaseClient } from "../../infrastructure/supabase/clientFactory.js";
import { SupabasePreferencesRepository } from "../../infrastructure/supabase/SupabasePreferencesRepository.js";

function buildPreferencesService(token: string, userId: string) {
  const client = createUserScopedSupabaseClient(token);
  return new PreferencesService(new SupabasePreferencesRepository(client, userId));
}

export async function registerPreferenceRoutes(app: FastifyInstance) {
  app.get("/me/preferences", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    return buildPreferencesService(auth.token, auth.userId).getPreferences();
  });

  app.put("/me/preferences", { preHandler: authenticateRequest }, async (request) => {
    const auth = requireAuth(request);
    const body = parseWithSchema(updatePreferencesSchema, request.body);
    return buildPreferencesService(auth.token, auth.userId).updatePreferences(body);
  });
}
