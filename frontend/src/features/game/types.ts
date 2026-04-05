export type Cell = 0 | 1;
export type Grid = Cell[][];

export interface World {
  id: string;
  name: string;
  width: number;
  height: number;
  grid: Grid;
  createdAt: string;
  updatedAt: string;
  generation: number;
}

export interface WorldSummary {
  id: string;
  name: string;
  width: number;
  height: number;
  updatedAt: string;
  generation: number;
}
