import type { RepositoryContext } from "../../../domain/repositories/RepositoryContext.js";
import type {
  CreatePatternInput,
  PatternRepository,
} from "../../../domain/repositories/PatternRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type { SupabaseClientFactory } from "./SupabaseClientFactory.js";
import { mapPatternRow, type PatternRow } from "./mappers.js";

export class SupabasePatternRepository implements PatternRepository {
  constructor(private readonly clientFactory: SupabaseClientFactory) {}

  async listPatterns(context: RepositoryContext) {
    const client = this.clientFactory.createUserClient(context.accessToken);
    const { data, error } = await client
      .from("patterns")
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new AppError(500, "PATTERN_LIST_FAILED", error.message);
    }

    return (data ?? []).map((row) => mapPatternRow(row as PatternRow));
  }

  async createPattern(context: RepositoryContext, input: CreatePatternInput) {
    const client = this.clientFactory.createUserClient(context.accessToken);
    const { data, error } = await client
      .from("patterns")
      .insert({
        user_id: context.userId,
        name: input.name,
        description: input.description,
        width: input.width,
        height: input.height,
        cells: input.cells,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError(500, "PATTERN_CREATE_FAILED", error?.message ?? "Unable to create pattern.");
    }

    return mapPatternRow(data as PatternRow);
  }

  async deletePattern(context: RepositoryContext, patternId: string) {
    const client = this.clientFactory.createUserClient(context.accessToken);
    const { error } = await client
      .from("patterns")
      .delete()
      .eq("id", patternId)
      .eq("user_id", context.userId);

    if (error) {
      throw new AppError(500, "PATTERN_DELETE_FAILED", error.message);
    }
  }
}
