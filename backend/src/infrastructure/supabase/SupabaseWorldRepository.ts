import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorldRepository, CreateWorldInput, ReplaceWorldStateInput } from "../../domain/repositories/WorldRepository.js";
import { mapWorldRow, mapWorldSummary } from "./mappers.js";
import type { CloudWorld, WorldSummary } from "../../../../shared/src/game/types.js";

export class SupabaseWorldRepository implements WorldRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<WorldSummary[]> {
    const { data, error } = await this.client
      .from("worlds")
      .select("id, owner_user_id, name, width, height, grid_json, generation, version, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapWorldSummary(row as never));
  }

  async getById(id: string): Promise<CloudWorld | null> {
    const { data, error } = await this.client
      .from("worlds")
      .select("id, owner_user_id, name, width, height, grid_json, generation, version, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapWorldRow(data as never) : null;
  }

  async create(input: CreateWorldInput): Promise<CloudWorld> {
    const { data, error } = await this.client
      .from("worlds")
      .insert({
        name: input.name,
        width: input.width,
        height: input.height,
        grid_json: input.grid,
        generation: input.generation ?? 0,
      })
      .select("id, owner_user_id, name, width, height, grid_json, generation, version, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return mapWorldRow(data as never);
  }

  async rename(id: string, name: string): Promise<CloudWorld | null> {
    const { data, error } = await this.client
      .from("worlds")
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, owner_user_id, name, width, height, grid_json, generation, version, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapWorldRow(data as never) : null;
  }

  async replaceState(id: string, input: ReplaceWorldStateInput): Promise<CloudWorld | null> {
    const { data, error } = await this.client
      .from("worlds")
      .update({
        grid_json: input.grid,
        generation: input.generation,
        version: input.expectedVersion + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("version", input.expectedVersion)
      .select("id, owner_user_id, name, width, height, grid_json, generation, version, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapWorldRow(data as never) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { error, count } = await this.client
      .from("worlds")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return (count ?? 0) > 0;
  }
}
