import { applyCellBatch, computeNextGeneration, createEmptyGrid, randomizeGrid } from "../../../../shared/src/game/engine.js";
import { getPatternById, insertPatternAt } from "../../../../shared/src/game/patterns.js";
import type { CellBatchPatch, CloudWorld, PatternDefinition } from "../../../../shared/src/game/types.js";
import { HttpError } from "../../shared/errors/httpError.js";
import type { PatternRepository } from "../../domain/repositories/PatternRepository.js";
import type { WorldRepository } from "../../domain/repositories/WorldRepository.js";

interface ApplyPatternInput {
  patternId: string;
  anchorX: number;
  anchorY: number;
  expectedVersion: number;
}

export class WorldService {
  constructor(
    private readonly worlds: WorldRepository,
    private readonly patterns: PatternRepository,
  ) {}

  async listWorlds() {
    return this.worlds.list();
  }

  async getWorld(id: string) {
    const world = await this.worlds.getById(id);

    if (!world) {
      throw new HttpError(404, "WORLD_NOT_FOUND", "World not found.");
    }

    return world;
  }

  async createWorld(input: { name: string; width: number; height: number }) {
    return this.createImportedWorld({
      ...input,
      grid: createEmptyGrid(input.width, input.height),
      generation: 0,
    });
  }

  async createImportedWorld(input: {
    name: string;
    width: number;
    height: number;
    grid: CloudWorld["grid"];
    generation: number;
  }) {
    return this.worlds.create({
      name: input.name,
      width: input.width,
      height: input.height,
      grid: input.grid,
      generation: input.generation,
    });
  }

  async renameWorld(id: string, name: string) {
    const world = await this.worlds.rename(id, name);

    if (!world) {
      throw new HttpError(404, "WORLD_NOT_FOUND", "World not found.");
    }

    return world;
  }

  async deleteWorld(id: string) {
    const deleted = await this.worlds.delete(id);

    if (!deleted) {
      throw new HttpError(404, "WORLD_NOT_FOUND", "World not found.");
    }
  }

  async patchCells(id: string, input: CellBatchPatch) {
    return this.mutateWorld(id, input.expectedVersion, (world) => {
      const updates = [
        ...input.setAlive.map((point) => ({ ...point, value: 1 as const })),
        ...input.setDead.map((point) => ({ ...point, value: 0 as const })),
      ];

      return {
        grid: applyCellBatch(world.grid, updates),
        generation: world.generation,
      };
    });
  }

  async stepWorld(id: string, expectedVersion: number) {
    return this.mutateWorld(id, expectedVersion, (world) => ({
      grid: computeNextGeneration(world.grid),
      generation: world.generation + 1,
    }));
  }

  async randomizeWorld(id: string, expectedVersion: number) {
    return this.mutateWorld(id, expectedVersion, (world) => ({
      grid: randomizeGrid(world.width, world.height),
      generation: 0,
    }));
  }

  async clearWorld(id: string, expectedVersion: number) {
    return this.mutateWorld(id, expectedVersion, (world) => ({
      grid: createEmptyGrid(world.width, world.height),
      generation: 0,
    }));
  }

  async applyPattern(id: string, input: ApplyPatternInput) {
    const pattern = await this.resolvePattern(input.patternId);

    return this.mutateWorld(id, input.expectedVersion, (world) => ({
      grid: insertPatternAt(world.grid, pattern.id, input.anchorX, input.anchorY, [pattern]),
      generation: world.generation,
    }));
  }

  private async resolvePattern(patternId: string): Promise<PatternDefinition> {
    const builtin = getPatternById(patternId);

    if (builtin) {
      return builtin;
    }

    const customPattern = await this.patterns.getById(patternId);

    if (!customPattern) {
      throw new HttpError(404, "PATTERN_NOT_FOUND", "Pattern not found.");
    }

    return customPattern;
  }

  private async mutateWorld(
    id: string,
    expectedVersion: number,
    update: (world: CloudWorld) => { grid: CloudWorld["grid"]; generation: number },
  ) {
    const currentWorld = await this.worlds.getById(id);

    if (!currentWorld) {
      throw new HttpError(404, "WORLD_NOT_FOUND", "World not found.");
    }

    if (currentWorld.version !== expectedVersion) {
      throw new HttpError(409, "WORLD_VERSION_CONFLICT", "World version conflict.", {
        latestWorld: currentWorld,
      });
    }

    const nextState = update(currentWorld);
    const updatedWorld = await this.worlds.replaceState(id, {
      grid: nextState.grid,
      generation: nextState.generation,
      expectedVersion,
    });

    if (updatedWorld) {
      return updatedWorld;
    }

    const latestWorld = await this.worlds.getById(id);

    throw new HttpError(409, "WORLD_VERSION_CONFLICT", "World version conflict.", {
      latestWorld,
    });
  }
}
