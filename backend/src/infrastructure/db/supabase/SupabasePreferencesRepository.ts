import { DEFAULT_SIMULATION_SPEED, type UserPreferences } from "@game-of-life/shared-game";
import type { RepositoryContext } from "../../../domain/repositories/RepositoryContext.js";
import type {
  PreferencesRepository,
  UpdatePreferencesInput,
} from "../../../domain/repositories/PreferencesRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type { SupabaseClientFactory } from "./SupabaseClientFactory.js";
import { mapPreferenceRow, type PreferenceRow } from "./mappers.js";

function createDefaultPreferences(): UserPreferences {
  return {
    simulationSpeed: DEFAULT_SIMULATION_SPEED,
    lastOpenedWorldId: null,
    updatedAt: new Date().toISOString(),
  };
}

export class SupabasePreferencesRepository implements PreferencesRepository {
  constructor(private readonly clientFactory: SupabaseClientFactory) {}

  async getPreferences(context: RepositoryContext) {
    const client = this.clientFactory.createUserClient(context.accessToken);
    const { data, error } = await client
      .from("user_preferences")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) {
      throw new AppError(500, "PREFERENCES_FETCH_FAILED", error.message);
    }

    return data ? mapPreferenceRow(data as PreferenceRow) : createDefaultPreferences();
  }

  async savePreferences(context: RepositoryContext, input: UpdatePreferencesInput) {
    const client = this.clientFactory.createUserClient(context.accessToken);
    const { data, error } = await client
      .from("user_preferences")
      .upsert(
        {
          user_id: context.userId,
          simulation_speed: input.simulationSpeed,
          last_opened_world_id: input.lastOpenedWorldId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError(
        500,
        "PREFERENCES_SAVE_FAILED",
        error?.message ?? "Unable to save preferences.",
      );
    }

    return mapPreferenceRow(data as PreferenceRow);
  }
}
