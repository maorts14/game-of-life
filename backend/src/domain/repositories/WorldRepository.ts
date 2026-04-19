import type { CloudWorld, Grid, WorldSummary } from "../../../../shared/src/game/types.js";

export interface CreateWorldInput {
  name: string;
  width: number;
  height: number;
  grid: Grid;
  generation?: number;
}

export interface ReplaceWorldStateInput {
  grid: Grid;
  generation: number;
  expectedVersion: number;
}

export interface WorldRepository {
  list(): Promise<WorldSummary[]>;
  getById(id: string): Promise<CloudWorld | null>;
  create(input: CreateWorldInput): Promise<CloudWorld>;
  rename(id: string, name: string): Promise<CloudWorld | null>;
  replaceState(id: string, input: ReplaceWorldStateInput): Promise<CloudWorld | null>;
  delete(id: string): Promise<boolean>;
}
