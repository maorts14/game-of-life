import type { PatternDefinition } from "@game-of-life/shared-game";
import { apiRequest } from "./http";

export function listCloudPatterns() {
  return apiRequest<PatternDefinition[]>("/api/patterns");
}

export function createCloudPattern(input: {
  name: string;
  description: string;
  width: number;
  height: number;
  cells: PatternDefinition["cells"];
}) {
  return apiRequest<PatternDefinition>("/api/patterns", {
    method: "POST",
    json: input,
  });
}

export function deleteCloudPattern(patternId: string) {
  return apiRequest<void>(`/api/patterns/${patternId}`, {
    method: "DELETE",
  });
}
