import type { FastifyInstance } from "fastify";
import { authBodySchema } from "../../application/dto/authSchemas.js";
import { signIn, signOut, signUp } from "../../application/use-cases/authUseCases.js";
import type { AppDependencies } from "../types.js";

export async function authRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.post("/api/auth/signup", async (request, reply) => {
    const body = authBodySchema.parse(request.body);
    const result = await signUp(dependencies.authService, body.email, body.password);

    if (result.session) {
      const csrfToken = dependencies.sessionCookieManager.createCsrfToken();
      dependencies.sessionCookieManager.setSessionCookies(
        reply,
        dependencies.env,
        result.session,
        csrfToken,
      );
    }

    reply.status(201);
    return {
      user: result.user,
      requiresEmailConfirmation: result.requiresEmailConfirmation,
    };
  });

  app.post("/api/auth/login", async (request, reply) => {
    const body = authBodySchema.parse(request.body);
    const session = await signIn(dependencies.authService, body.email, body.password);
    const csrfToken = dependencies.sessionCookieManager.createCsrfToken();

    dependencies.sessionCookieManager.setSessionCookies(reply, dependencies.env, session, csrfToken);

    return {
      user: session.user,
    };
  });

  app.post(
    "/api/auth/logout",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request, reply) => {
      await signOut(dependencies.authService, request.auth!.accessToken);
      dependencies.sessionCookieManager.clearSessionCookies(reply, dependencies.env);
      reply.status(204).send();
    },
  );
}
