import { createRequireAuth } from "./api/middlewares/requireAuth.js";
import type { AppDependencies } from "./api/types.js";
import { SupabaseAuthAdapter } from "./infrastructure/auth/supabase/SupabaseAuthAdapter.js";
import { SessionCookieManager } from "./infrastructure/auth/SessionCookieManager.js";
import { loadEnv } from "./infrastructure/config/env.js";
import { SupabaseClientFactory } from "./infrastructure/db/supabase/SupabaseClientFactory.js";
import { SupabasePatternRepository } from "./infrastructure/db/supabase/SupabasePatternRepository.js";
import { SupabasePreferencesRepository } from "./infrastructure/db/supabase/SupabasePreferencesRepository.js";
import { SupabaseWorldRepository } from "./infrastructure/db/supabase/SupabaseWorldRepository.js";

export function createDependencies(): AppDependencies {
  const env = loadEnv();
  const clientFactory = new SupabaseClientFactory(env);
  const authService = new SupabaseAuthAdapter(clientFactory);
  const sessionCookieManager = new SessionCookieManager(env.SESSION_ENCRYPTION_KEY);

  return {
    env,
    authService,
    worldRepository: new SupabaseWorldRepository(clientFactory),
    patternRepository: new SupabasePatternRepository(clientFactory),
    preferencesRepository: new SupabasePreferencesRepository(clientFactory),
    sessionCookieManager,
    requireAuth: createRequireAuth(authService, sessionCookieManager, env),
  };
}
