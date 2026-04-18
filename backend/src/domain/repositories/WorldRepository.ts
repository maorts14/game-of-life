import type { CellDiff, World, WorldSummary } from "@game-of-life/shared-game";
import type { RepositoryContext } from "./RepositoryContext.js";

export interface CreateWorldInput {
  name: string;
  width: number;
  height: number;
}

export interface UpdateWorldMetadataInput {
  name: string;
}

export interface ReplaceWorldStateInput {
  grid: World["grid"];
  generation: number;
}

export interface WorldRepository {
  listWorlds(context: RepositoryContext): Promise<WorldSummary[]>;
  createWorld(context: RepositoryContext, input: CreateWorldInput): Promise<World>;
  getWorld(context: RepositoryContext, worldId: string): Promise<World | null>;
  updateWorldMetadata(
    context: RepositoryContext,
    worldId: string,
    input: UpdateWorldMetadataInput,
  ): Promise<World>;
  deleteWorld(context: RepositoryContext, worldId: string): Promise<void>;
  patchWorldCells(context: RepositoryContext, worldId: string, diff: CellDiff): Promise<World>;
  replaceWorldState(
    context: RepositoryContext,
    worldId: string,
    input: ReplaceWorldStateInput,
  ): Promise<World>;
}
