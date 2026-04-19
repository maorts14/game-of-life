import { BUILTIN_PATTERNS } from "../../../../shared/src/game/patterns.js";
import { HttpError } from "../../shared/errors/httpError.js";
import type { PatternRepository } from "../../domain/repositories/PatternRepository.js";

export class PatternService {
  constructor(private readonly patterns: PatternRepository) {}

  async listBuiltinPatterns() {
    return BUILTIN_PATTERNS;
  }

  async listMyPatterns() {
    return this.patterns.listMine();
  }

  async createPattern(input: {
    name: string;
    description: string;
    width: number;
    height: number;
    cells: Array<[number, number]>;
  }) {
    return this.patterns.create(input);
  }

  async deletePattern(id: string) {
    const deleted = await this.patterns.delete(id);

    if (!deleted) {
      throw new HttpError(404, "PATTERN_NOT_FOUND", "Pattern not found.");
    }
  }
}
