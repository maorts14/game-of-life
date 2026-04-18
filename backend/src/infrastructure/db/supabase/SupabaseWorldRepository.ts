import { createEmptyGrid, setCell, type CellDiff } from "@game-of-life/shared-game";
import type { World } from "@game-of-life/shared-game";
import type { RepositoryContext } from "../../../domain/repositories/RepositoryContext.js";
import type {
  CreateWorldInput,
  ReplaceWorldStateInput,
  UpdateWorldMetadataInput,
  WorldRepository,
} from "../../../domain/repositories/WorldRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type { SupabaseClientFactory } from "./SupabaseClientFactory.js";
import { mapWorldRow, mapWorldSummaryRow, type WorldRow } from "./mappers.js";

function applyCellDiff(world: World, diff: CellDiff): World["grid"] {
  let nextGrid = world.grid;

  for (const [x, y] of diff.setAlive) {
    if (y < nextGrid.length && x < (nextGrid[0]?.length ?? 0)) {
      nextGrid = setCell(nextGrid, x, y, 1);
    }
  }

  for (const [x, y] of diff.setDead) {
    if (y < nextGrid.length && x < (nextGrid[0]?.length ?? 0)) {
      nextGrid = setCell(nextGrid, x, y, 0);
    }
  }

  return nextGrid;
}

export class SupabaseWorldRepository implements WorldRepository {
  constructor(private readonly clientFactory: SupabaseClientFactory) {}

  async listWorlds(context: RepositoryContext) {
    const client = this.clientFactory.createUserClient(context.accessToken);
    const { data, error } = await client
      .from("worlds")
      .select("id, name, width, height, updated_at, generation, version")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new AppError(500, "WORLD_LIST_FAILED", error.message);
    }

    return (data ?? []).map((row) => mapWorldSummaryRow(row));
  }

  async createWorld(context: RepositoryContext, input: CreateWorldInput) {
    const client = this.clientFactory.createUserClient(context.accessToken);
    const { data, error } = await client
      .from("worlds")
      .insert({
        user_id: context.userId,
        name: input.name,
        width: input.width,
        height: input.height,
        grid: createEmptyGrid(input.width, input.height),
        generation: 0,
        version: 1,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError(500, "WORLD_CREATE_FAILED", error?.message ?? "Unable to create world.");
    }

    return mapWorldRow(data as WorldRow);
  }

  async getWorld(context: RepositoryContext, worldId: string) {
    const client = this.clientFactory.createUserClient(context.accessToken);
    const { data, error } = await client
      .from("worlds")
      .select("*")
      .eq("id", worldId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) {
      throw new AppError(500, "WORLD_FETCH_FAILED", error.message);
    }

    return data ? mapWorldRow(data as WorldRow) : null;
  }

  async updateWorldMetadata(
    context: RepositoryContext,
    worldId: string,
    input: UpdateWorldMetadataInput,
  ) {
    const currentWorld = await this.requireWorld(context, worldId);
    return this.persistWorld(context, worldId, {
      name: input.name,
      version: (currentWorld.version ?? 0) + 1,
    });
  }

  async deleteWorld(context: RepositoryContext, worldId: string) {
    const client = this.clientFactory.createUserClient(context.accessToken);
    const { error } = await client
      .from("worlds")
      .delete()
      .eq("id", worldId)
      .eq("user_id", context.userId);

    if (error) {
      throw new AppError(500, "WORLD_DELETE_FAILED", error.message);
    }
  }

  async patchWorldCells(context: RepositoryContext, worldId: string, diff: CellDiff) {
    const currentWorld = await this.requireWorld(context, worldId);
    return this.persistWorld(context, worldId, {
      grid: applyCellDiff(currentWorld, diff),
      version: (currentWorld.version ?? 0) + 1,
    });
  }

  async replaceWorldState(
    context: RepositoryContext,
    worldId: string,
    input: ReplaceWorldStateInput,
  ) {
    const currentWorld = await this.requireWorld(context, worldId);
    return this.persistWorld(context, worldId, {
      grid: input.grid,
      generation: input.generation,
      version: (currentWorld.version ?? 0) + 1,
    });
  }

  private async requireWorld(context: RepositoryContext, worldId: string) {
    const world = await this.getWorld(context, worldId);

    if (!world) {
      throw new AppError(404, "WORLD_NOT_FOUND", "World not found.");
    }

    return world;
  }

  private async persistWorld(
    context: RepositoryContext,
    worldId: string,
    patch: Partial<Pick<WorldRow, "name" | "grid" | "generation" | "version">>,
  ) {
    const client = this.clientFactory.createUserClient(context.accessToken);
    const { data, error } = await client
      .from("worlds")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", worldId)
      .eq("user_id", context.userId)
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError(500, "WORLD_UPDATE_FAILED", error?.message ?? "Unable to update world.");
    }

    return mapWorldRow(data as WorldRow);
  }
}
