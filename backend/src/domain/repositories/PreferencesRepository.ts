import type { UserPreferences } from "@game-of-life/shared-game";
import type { RepositoryContext } from "./RepositoryContext.js";

export interface UpdatePreferencesInput {
  simulationSpeed: number;
  lastOpenedWorldId: string | null;
}

export interface PreferencesRepository {
  getPreferences(context: RepositoryContext): Promise<UserPreferences>;
  savePreferences(
    context: RepositoryContext,
    input: UpdatePreferencesInput,
  ): Promise<UserPreferences>;
}
