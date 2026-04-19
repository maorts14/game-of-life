import type { UserPreferences } from "../../../../shared/src/game/types.js";

export interface UpdatePreferencesInput {
  simulationSpeed?: number;
  lastOpenedCloudWorldId?: string | null;
}

export interface PreferencesRepository {
  get(): Promise<UserPreferences>;
  update(input: UpdatePreferencesInput): Promise<UserPreferences>;
}
