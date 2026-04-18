import type { FastifyInstance } from "fastify";
import { createPatternSchema } from "../../application/dto/patternSchemas.js";
import {
  createPattern,
  deletePattern,
  listPatterns,
} from "../../application/use-cases/patternUseCases.js";
import type { AppDependencies } from "../types.js";

export async function patternRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.get(
    "/api/patterns",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request) =>
      listPatterns(dependencies.patternRepository, {
        userId: request.auth!.user.id,
        accessToken: request.auth!.accessToken,
      }),
  );

  app.post(
    "/api/patterns",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request, reply) => {
      const body = createPatternSchema.parse(request.body);
      const pattern = await createPattern(
        dependencies.patternRepository,
        {
          userId: request.auth!.user.id,
          accessToken: request.auth!.accessToken,
        },
        body,
      );

      reply.status(201);
      return pattern;
    },
  );

  app.delete(
    "/api/patterns/:patternId",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request, reply) => {
      const params = request.params as { patternId: string };
      await deletePattern(
        dependencies.patternRepository,
        {
          userId: request.auth!.user.id,
          accessToken: request.auth!.accessToken,
        },
        params.patternId,
      );

      reply.status(204).send();
    },
  );
}
