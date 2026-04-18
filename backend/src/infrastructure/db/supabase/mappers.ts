import type { PatternDefinition, UserPreferences, World, WorldSummary } from "@game-of-life/shared-game";

export interface WorldRow {
  id: string;
  user_id: string;
  name: string;
  width: number;
  height: number;
  grid: World["grid"];
  generation: number;
  created_at: string;
  updated_at: string;
  version: number | null;
}

export interface PatternRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  cells: PatternDefinition["cells"];
  created_at: string;
  updated_at: string;
}

export interface PreferenceRow {
  user_id: string;
  simulation_speed: number;
  last_opened_world_id: string | null;
  updated_at: string;
}

export function mapWorldRow(row: WorldRow): World {
  return {
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    grid: row.grid,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    generation: row.generation,
    version: row.version ?? undefined,
  };
}

export function mapWorldSummaryRow(
  row: Pick<WorldRow, "id" | "name" | "width" | "height" | "updated_at" | "generation" | "version">,
): WorldSummary {
  return {
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    updatedAt: row.updated_at,
    generation: row.generation,
    version: row.version ?? undefined,
  };
}

export function mapPatternRow(row: PatternRow): PatternDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    width: row.width,
    height: row.height,
    cells: row.cells,
    ownerUserId: row.user_id,
    isBuiltin: false,
  };
}

export function mapPreferenceRow(row: PreferenceRow): UserPreferences {
  return {
    simulationSpeed: row.simulation_speed,
    lastOpenedWorldId: row.last_opened_world_id,
    updatedAt: row.updated_at,
  };
}
