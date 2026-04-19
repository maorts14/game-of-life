import type { CloudPattern, CloudWorld, UserPreferences, WorldSummary } from "../../../../shared/src/game/types.js";

interface WorldRow {
  id: string;
  owner_user_id: string;
  name: string;
  width: number;
  height: number;
  grid_json: CloudWorld["grid"];
  generation: number;
  version: number;
  created_at: string;
  updated_at: string;
}

interface PatternRow {
  id: string;
  owner_user_id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  cells_json: CloudPattern["cells"];
  created_at: string;
  updated_at: string;
}

interface PreferencesRow {
  simulation_speed: number;
  last_opened_cloud_world_id: string | null;
  updated_at: string;
}

export function mapWorldRow(row: WorldRow): CloudWorld {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    width: row.width,
    height: row.height,
    grid: row.grid_json,
    generation: row.generation,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storageMode: "cloud",
  };
}

export function mapWorldSummary(row: WorldRow): WorldSummary {
  return {
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    updatedAt: row.updated_at,
    generation: row.generation,
    storageMode: "cloud",
    version: row.version,
  };
}

export function mapPatternRow(row: PatternRow): CloudPattern {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description,
    width: row.width,
    height: row.height,
    cells: row.cells_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storageMode: "cloud",
  };
}

export function mapPreferencesRow(row: PreferencesRow | null): UserPreferences {
  return {
    simulationSpeed: row?.simulation_speed ?? 8,
    lastOpenedCloudWorldId: row?.last_opened_cloud_world_id ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}
