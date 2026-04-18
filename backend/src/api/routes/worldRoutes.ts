import type { FastifyInstance } from "fastify";
import { createWorldSchema, patchWorldCellsSchema, replaceWorldStateSchema, updateWorldMetadataSchema } from "../../application/dto/worldSchemas.js";
import {
  createWorld,
  deleteWorld,
  getWorld,
  listWorlds,
  patchWorldCells,
  replaceWorldState,
  updateWorldMetadata,
} from "../../application/use-cases/worldUseCases.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { AppDependencies } from "../types.js";

export async function worldRoutes(app: FastifyInstance, dependencies: AppDependencies) {
  app.get(
    "/api/worlds",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request) =>
      listWorlds(dependencies.worldRepository, {
        userId: request.auth!.user.id,
        accessToken: request.auth!.accessToken,
      }),
  );

  app.post(
    "/api/worlds",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request, reply) => {
      const body = createWorldSchema.parse(request.body);
      const world = await createWorld(
        dependencies.worldRepository,
        {
          userId: request.auth!.user.id,
          accessToken: request.auth!.accessToken,
        },
        body,
      );

      reply.status(201);
      return world;
    },
  );

  app.get(
    "/api/worlds/:worldId",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request) => {
      const params = request.params as { worldId: string };
      const world = await getWorld(
        dependencies.worldRepository,
        {
          userId: request.auth!.user.id,
          accessToken: request.auth!.accessToken,
        },
        params.worldId,
      );

      if (!world) {
        throw new AppError(404, "WORLD_NOT_FOUND", "World not found.");
      }

      return world;
    },
  );

  app.patch(
    "/api/worlds/:worldId",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request) => {
      const params = request.params as { worldId: string };
      const body = updateWorldMetadataSchema.parse(request.body);

      return updateWorldMetadata(
        dependencies.worldRepository,
        {
          userId: request.auth!.user.id,
          accessToken: request.auth!.accessToken,
        },
        params.worldId,
        body,
      );
    },
  );

  app.delete(
    "/api/worlds/:worldId",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request, reply) => {
      const params = request.params as { worldId: string };
      await deleteWorld(
        dependencies.worldRepository,
        {
          userId: request.auth!.user.id,
          accessToken: request.auth!.accessToken,
        },
        params.worldId,
      );

      reply.status(204).send();
    },
  );

  app.patch(
    "/api/worlds/:worldId/cells",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request) => {
      const params = request.params as { worldId: string };
      const body = patchWorldCellsSchema.parse(request.body);

      return patchWorldCells(
        dependencies.worldRepository,
        {
          userId: request.auth!.user.id,
          accessToken: request.auth!.accessToken,
        },
        params.worldId,
        body,
      );
    },
  );

  app.put(
    "/api/worlds/:worldId/state",
    {
      preHandler: dependencies.requireAuth,
    },
    async (request) => {
      const params = request.params as { worldId: string };
      const body = replaceWorldStateSchema.parse(request.body);

      return replaceWorldState(
        dependencies.worldRepository,
        {
          userId: request.auth!.user.id,
          accessToken: request.auth!.accessToken,
        },
        params.worldId,
        body,
      );
    },
  );
}
