import type { CloudPattern } from "../../../../shared/src/game/types.js";

export interface CreatePatternInput {
  name: string;
  description: string;
  width: number;
  height: number;
  cells: Array<[number, number]>;
}

export interface PatternRepository {
  listMine(): Promise<CloudPattern[]>;
  getById(id: string): Promise<CloudPattern | null>;
  create(input: CreatePatternInput): Promise<CloudPattern>;
  delete(id: string): Promise<boolean>;
}
