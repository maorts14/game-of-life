import type { PatternDefinition } from "@game-of-life/shared-game";
import type { RepositoryContext } from "./RepositoryContext.js";

export interface CreatePatternInput {
  name: string;
  description: string;
  width: number;
  height: number;
  cells: PatternDefinition["cells"];
}

export interface PatternRepository {
  listPatterns(context: RepositoryContext): Promise<PatternDefinition[]>;
  createPattern(context: RepositoryContext, input: CreatePatternInput): Promise<PatternDefinition>;
  deletePattern(context: RepositoryContext, patternId: string): Promise<void>;
}
