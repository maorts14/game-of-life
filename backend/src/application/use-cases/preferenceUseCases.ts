import type { RepositoryContext } from "../../domain/repositories/RepositoryContext.js";
import type {
  PreferencesRepository,
  UpdatePreferencesInput,
} from "../../domain/repositories/PreferencesRepository.js";

export function getPreferences(
  preferencesRepository: PreferencesRepository,
  context: RepositoryContext,
) {
  return preferencesRepository.getPreferences(context);
}

export function savePreferences(
  preferencesRepository: PreferencesRepository,
  context: RepositoryContext,
  input: UpdatePreferencesInput,
) {
  return preferencesRepository.savePreferences(context, input);
}
