import { BUILTIN_PATTERNS } from "@game-of-life/shared-game";
import type { RepositoryContext } from "../../domain/repositories/RepositoryContext.js";
import type {
  CreatePatternInput,
  PatternRepository,
} from "../../domain/repositories/PatternRepository.js";

export async function listPatterns(patternRepository: PatternRepository, context: RepositoryContext) {
  const customPatterns = await patternRepository.listPatterns(context);
  return [...BUILTIN_PATTERNS, ...customPatterns];
}

export function createPattern(
  patternRepository: PatternRepository,
  context: RepositoryContext,
  input: CreatePatternInput,
) {
  return patternRepository.createPattern(context, input);
}

export function deletePattern(
  patternRepository: PatternRepository,
  context: RepositoryContext,
  patternId: string,
) {
  return patternRepository.deletePattern(context, patternId);
}
