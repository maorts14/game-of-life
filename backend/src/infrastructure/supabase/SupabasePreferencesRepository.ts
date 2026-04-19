import type { SupabaseClient } from "@supabase/supabase-js";
import type { PreferencesRepository, UpdatePreferencesInput } from "../../domain/repositories/PreferencesRepository.js";
import { mapPreferencesRow } from "./mappers.js";
import type { UserPreferences } from "../../../../shared/src/game/types.js";

export class SupabasePreferencesRepository implements PreferencesRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async get(): Promise<UserPreferences> {
    const { data, error } = await this.client
      .from("user_preferences")
      .select("simulation_speed, last_opened_cloud_world_id, updated_at")
      .eq("user_id", this.userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return mapPreferencesRow(data as never);
  }

  async update(input: UpdatePreferencesInput): Promise<UserPreferences> {
    const payload: Record<string, unknown> = {
      user_id: this.userId,
      updated_at: new Date().toISOString(),
    };

    if (input.simulationSpeed !== undefined) {
      payload.simulation_speed = input.simulationSpeed;
    }

    if (input.lastOpenedCloudWorldId !== undefined) {
      payload.last_opened_cloud_world_id = input.lastOpenedCloudWorldId;
    }

    const { data, error } = await this.client
      .from("user_preferences")
      .upsert(payload)
      .select("simulation_speed, last_opened_cloud_world_id, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return mapPreferencesRow(data as never);
  }
}
