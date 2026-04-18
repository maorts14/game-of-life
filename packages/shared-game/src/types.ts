export type Cell = 0 | 1;
export type Grid = Cell[][];
export type Coordinate = [number, number];
export type WorldSource = "local" | "cloud";

export interface World {
  id: string;
  name: string;
  width: number;
  height: number;
  grid: Grid;
  createdAt: string;
  updatedAt: string;
  generation: number;
  version?: number;
}

export interface WorldSummary {
  id: string;
  name: string;
  width: number;
  height: number;
  updatedAt: string;
  generation: number;
  version?: number;
}

export interface PatternDefinition {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  cells: Coordinate[];
  ownerUserId?: string | null;
  isBuiltin?: boolean;
}

export interface SelectionBounds {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface UserPreferences {
  simulationSpeed: number;
  lastOpenedWorldId: string | null;
  updatedAt: string;
}

export interface CellDiff {
  setAlive: Coordinate[];
  setDead: Coordinate[];
}
