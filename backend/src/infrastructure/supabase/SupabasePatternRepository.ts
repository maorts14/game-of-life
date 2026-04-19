import type { SupabaseClient } from "@supabase/supabase-js";
import type { PatternRepository, CreatePatternInput } from "../../domain/repositories/PatternRepository.js";
import { mapPatternRow } from "./mappers.js";
import type { CloudPattern } from "../../../../shared/src/game/types.js";

export class SupabasePatternRepository implements PatternRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<CloudPattern[]> {
    const { data, error } = await this.client
      .from("patterns")
      .select("id, owner_user_id, name, description, width, height, cells_json, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapPatternRow(row as never));
  }

  async getById(id: string): Promise<CloudPattern | null> {
    const { data, error } = await this.client
      .from("patterns")
      .select("id, owner_user_id, name, description, width, height, cells_json, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapPatternRow(data as never) : null;
  }

  async create(input: CreatePatternInput): Promise<CloudPattern> {
    const { data, error } = await this.client
      .from("patterns")
      .insert({
        name: input.name,
        description: input.description,
        width: input.width,
        height: input.height,
        cells_json: input.cells,
      })
      .select("id, owner_user_id, name, description, width, height, cells_json, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return mapPatternRow(data as never);
  }

  async delete(id: string): Promise<boolean> {
    const { error, count } = await this.client
      .from("patterns")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return (count ?? 0) > 0;
  }
}
