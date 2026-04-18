import type { CellDiff } from "@game-of-life/shared-game";
import type { RepositoryContext } from "../../domain/repositories/RepositoryContext.js";
import type {
  CreateWorldInput,
  ReplaceWorldStateInput,
  UpdateWorldMetadataInput,
  WorldRepository,
} from "../../domain/repositories/WorldRepository.js";

export function listWorlds(worldRepository: WorldRepository, context: RepositoryContext) {
  return worldRepository.listWorlds(context);
}

export function createWorld(
  worldRepository: WorldRepository,
  context: RepositoryContext,
  input: CreateWorldInput,
) {
  return worldRepository.createWorld(context, input);
}

export function getWorld(worldRepository: WorldRepository, context: RepositoryContext, worldId: string) {
  return worldRepository.getWorld(context, worldId);
}

export function updateWorldMetadata(
  worldRepository: WorldRepository,
  context: RepositoryContext,
  worldId: string,
  input: UpdateWorldMetadataInput,
) {
  return worldRepository.updateWorldMetadata(context, worldId, input);
}

export function deleteWorld(worldRepository: WorldRepository, context: RepositoryContext, worldId: string) {
  return worldRepository.deleteWorld(context, worldId);
}

export function patchWorldCells(
  worldRepository: WorldRepository,
  context: RepositoryContext,
  worldId: string,
  diff: CellDiff,
) {
  return worldRepository.patchWorldCells(context, worldId, diff);
}

export function replaceWorldState(
  worldRepository: WorldRepository,
  context: RepositoryContext,
  worldId: string,
  input: ReplaceWorldStateInput,
) {
  return worldRepository.replaceWorldState(context, worldId, input);
}
