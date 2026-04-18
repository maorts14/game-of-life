import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "../../domain/auth/AuthService.js";
import type { SessionCookieManager } from "../../infrastructure/auth/SessionCookieManager.js";
import type { AppEnv } from "../../infrastructure/config/env.js";
import { AppError } from "../../shared/errors/AppError.js";

function isMutatingMethod(method: string) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

export function createRequireAuth(
  authService: AuthService,
  sessionCookieManager: SessionCookieManager,
  env: AppEnv,
) {
  return async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    const session = sessionCookieManager.decodeSession(
      request.cookies[sessionCookieManager.sessionCookieName],
    );

    if (!session) {
      throw new AppError(401, "AUTH_REQUIRED", "Authentication is required.");
    }

    let currentSession = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      user: session.user,
    };
    let user = await authService.getUser(session.accessToken);

    if (!user) {
      const refreshedSession = await authService.refreshSession(session.refreshToken);
      user = refreshedSession.user;
      currentSession = refreshedSession;
      sessionCookieManager.setSessionCookies(reply, env, refreshedSession, session.csrfToken);
    }

    if (isMutatingMethod(request.method) && !sessionCookieManager.validateCsrf(request, session)) {
      throw new AppError(403, "CSRF_INVALID", "A valid CSRF token is required.");
    }

    request.auth = {
      user,
      accessToken: currentSession.accessToken,
      refreshToken: currentSession.refreshToken,
      csrfToken: session.csrfToken,
    };
  };
}
