import { createEmptyGrid } from "./engine.js";
import type { CloudWorld, Grid, LocalWorld, StorageMode, WorldSummary } from "./types.js";

export const DEFAULT_WORLD_NAME = "Void Core";

export function createId(prefix = "local"): string {
  const cryptoObject = globalThis.crypto;

  if (typeof cryptoObject?.randomUUID === "function") {
    return `${prefix}-${cryptoObject.randomUUID()}`;
  }

  if (typeof cryptoObject?.getRandomValues === "function") {
    const bytes = cryptoObject.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return [
      prefix,
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function createLocalWorldRecord(
  name: string,
  width: number,
  height: number,
  grid: Grid = createEmptyGrid(width, height),
): LocalWorld {
  const now = new Date().toISOString();

  return {
    id: createId(),
    name: name.trim() || DEFAULT_WORLD_NAME,
    width,
    height,
    grid,
    createdAt: now,
    updatedAt: now,
    generation: 0,
    storageMode: "local",
    syncedCloudId: null,
    lastSyncedAt: null,
  };
}

export function toWorldSummary(
  world: LocalWorld | CloudWorld,
  storageMode: StorageMode = world.storageMode,
): WorldSummary {
  return {
    id: world.id,
    name: world.name,
    width: world.width,
    height: world.height,
    updatedAt: world.updatedAt,
    generation: world.generation,
    storageMode,
    version: "version" in world ? world.version : undefined,
    syncedCloudId: "syncedCloudId" in world ? world.syncedCloudId ?? null : undefined,
  };
}
