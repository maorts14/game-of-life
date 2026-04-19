import assert from "node:assert/strict";
import { createEmptyGrid } from "../dist/shared/src/game/engine.js";
import { WorldService } from "../dist/backend/src/application/services/WorldService.js";

class InMemoryWorldRepository {
  worlds = {};

  constructor(initialWorld) {
    this.worlds[initialWorld.id] = initialWorld;
  }

  async list() {
    return Object.values(this.worlds).map((world) => ({
      id: world.id,
      name: world.name,
      width: world.width,
      height: world.height,
      updatedAt: world.updatedAt,
      generation: world.generation,
      storageMode: "cloud",
      version: world.version,
    }));
  }

  async getById(id) {
    return this.worlds[id] ?? null;
  }

  async create() {
    throw new Error("Not implemented for this check.");
  }

  async rename() {
    throw new Error("Not implemented for this check.");
  }

  async replaceState(id, input) {
    const world = this.worlds[id];

    if (!world || world.version !== input.expectedVersion) {
      return null;
    }

    const nextWorld = {
      ...world,
      grid: input.grid,
      generation: input.generation,
      version: input.expectedVersion + 1,
      updatedAt: "2026-04-19T00:00:01.000Z",
    };

    this.worlds[id] = nextWorld;
    return nextWorld;
  }

  async delete() {
    throw new Error("Not implemented for this check.");
  }
}

class InMemoryPatternRepository {
  constructor(patterns = []) {
    this.patterns = patterns;
  }

  async listMine() {
    return this.patterns;
  }

  async getById(id) {
    return this.patterns.find((pattern) => pattern.id === id) ?? null;
  }

  async create() {
    throw new Error("Not implemented for this check.");
  }

  async delete() {
    throw new Error("Not implemented for this check.");
  }
}

function createWorld() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    ownerUserId: "owner-1",
    name: "Test World",
    width: 4,
    height: 4,
    grid: createEmptyGrid(4, 4),
    createdAt: "2026-04-19T00:00:00.000Z",
    updatedAt: "2026-04-19T00:00:00.000Z",
    generation: 0,
    version: 1,
    storageMode: "cloud",
  };
}

async function main() {
  {
    const repository = new InMemoryWorldRepository(createWorld());
    const service = new WorldService(repository, new InMemoryPatternRepository());

    const updated = await service.patchCells("00000000-0000-0000-0000-000000000001", {
      setAlive: [{ x: 1, y: 1 }, { x: 2, y: 1 }],
      setDead: [],
      expectedVersion: 1,
    });

    assert.equal(updated.grid[1][1], 1);
    assert.equal(updated.grid[1][2], 1);
    assert.equal(updated.version, 2);
    assert.equal(updated.generation, 0);
  }

  {
    const repository = new InMemoryWorldRepository(createWorld());
    const service = new WorldService(repository, new InMemoryPatternRepository());

    await assert.rejects(
      service.stepWorld("00000000-0000-0000-0000-000000000001", 99),
      (error) =>
        error instanceof Error &&
        "statusCode" in error &&
        "code" in error &&
        error.statusCode === 409 &&
        error.code === "WORLD_VERSION_CONFLICT",
    );
  }

  {
    const repository = new InMemoryWorldRepository(createWorld());
    const service = new WorldService(repository, new InMemoryPatternRepository());

    const updated = await service.applyPattern("00000000-0000-0000-0000-000000000001", {
      patternId: "glider",
      anchorX: 1,
      anchorY: 1,
      expectedVersion: 1,
    });

    assert.ok(updated.grid.flat().reduce((sum, cell) => sum + cell, 0) > 0);
    assert.equal(updated.version, 2);
  }

  console.log("world-service checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
