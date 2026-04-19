export type Cell = 0 | 1;
export type Grid = Cell[][];
export type StorageMode = "local" | "cloud";

export interface WorldRef {
  storageMode: StorageMode;
  id: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface PatternDefinition {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  cells: Array<[number, number]>;
}

export interface LocalPattern extends PatternDefinition {
  storageMode: "local";
  syncedCloudId?: string | null;
  lastSyncedAt?: string | null;
}

export interface CloudPattern extends PatternDefinition {
  storageMode: "cloud";
  createdAt: string;
  updatedAt: string;
  ownerUserId?: string;
}

export type SavedPattern = LocalPattern | CloudPattern;

export interface BaseWorld {
  id: string;
  name: string;
  width: number;
  height: number;
  grid: Grid;
  createdAt: string;
  updatedAt: string;
  generation: number;
}

export interface LocalWorld extends BaseWorld {
  storageMode: "local";
  syncedCloudId?: string | null;
  lastSyncedAt?: string | null;
}

export interface CloudWorld extends BaseWorld {
  storageMode: "cloud";
  version: number;
  ownerUserId?: string;
}

export type GameWorld = LocalWorld | CloudWorld;

export interface WorldSummary {
  id: string;
  name: string;
  width: number;
  height: number;
  updatedAt: string;
  generation: number;
  storageMode: StorageMode;
  version?: number;
  syncedCloudId?: string | null;
}

export interface UserPreferences {
  simulationSpeed: number;
  lastOpenedCloudWorldId: string | null;
  updatedAt: string | null;
}

export interface SelectionBounds {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface CellBatchPatch {
  setAlive: Point[];
  setDead: Point[];
  expectedVersion: number;
}
