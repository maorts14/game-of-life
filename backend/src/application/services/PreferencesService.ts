import type { PreferencesRepository } from "../../domain/repositories/PreferencesRepository.js";

export class PreferencesService {
  constructor(private readonly preferences: PreferencesRepository) {}

  async getPreferences() {
    return this.preferences.get();
  }

  async updatePreferences(input: {
    simulationSpeed?: number;
    lastOpenedCloudWorldId?: string | null;
  }) {
    return this.preferences.update(input);
  }
}
