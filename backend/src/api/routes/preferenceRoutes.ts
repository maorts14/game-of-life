import type { FastifyInstance } from "fastify";
import { updatePreferencesSchema } from "../../application/dto/preferenceSchemas.js";
import {
  getPreferences,
  savePreferences,
} from "../../application/use-cases/preferenceUseCases.js";
import type { AppDependencies } from "../types.js";

export async function preferenceRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.get(
    "/api/me/preferences",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request) =>
      getPreferences(dependencies.preferencesRepository, {
        userId: request.auth!.user.id,
        accessToken: request.auth!.accessToken,
      }),
  );

  app.put(
    "/api/me/preferences",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request) => {
      const body = updatePreferencesSchema.parse(request.body);

      return savePreferences(
        dependencies.preferencesRepository,
        {
          userId: request.auth!.user.id,
          accessToken: request.auth!.accessToken,
        },
        body,
      );
    },
  );
}
