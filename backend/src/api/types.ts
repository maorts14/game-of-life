import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "../domain/auth/AuthService.js";
import type { PatternRepository } from "../domain/repositories/PatternRepository.js";
import type { PreferencesRepository } from "../domain/repositories/PreferencesRepository.js";
import type { WorldRepository } from "../domain/repositories/WorldRepository.js";
import type { SessionCookieManager } from "../infrastructure/auth/SessionCookieManager.js";
import type { AppEnv } from "../infrastructure/config/env.js";

export interface AppDependencies {
  env: AppEnv;
  authService: AuthService;
  worldRepository: WorldRepository;
  patternRepository: PatternRepository;
  preferencesRepository: PreferencesRepository;
  sessionCookieManager: SessionCookieManager;
  requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}
