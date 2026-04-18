import type { UserPreferences } from "@game-of-life/shared-game";
import { apiRequest } from "./http";

export function getCloudPreferences() {
  return apiRequest<UserPreferences>("/api/me/preferences");
}

export function saveCloudPreferences(input: {
  simulationSpeed: number;
  lastOpenedWorldId: string | null;
}) {
  return apiRequest<UserPreferences>("/api/me/preferences", {
    method: "PUT",
    json: input,
  });
}
