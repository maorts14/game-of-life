import type { CellDiff, World, WorldSummary } from "@game-of-life/shared-game";
import { apiRequest } from "./http";

export function listCloudWorlds() {
  return apiRequest<WorldSummary[]>("/api/worlds");
}

export function createCloudWorld(input: { name?: string; width: number; height: number }) {
  return apiRequest<World>("/api/worlds", {
    method: "POST",
    json: input,
  });
}

export function getCloudWorld(worldId: string) {
  return apiRequest<World>(`/api/worlds/${worldId}`);
}

export function updateCloudWorld(worldId: string, input: { name: string }) {
  return apiRequest<World>(`/api/worlds/${worldId}`, {
    method: "PATCH",
    json: input,
  });
}

export function deleteCloudWorld(worldId: string) {
  return apiRequest<void>(`/api/worlds/${worldId}`, {
    method: "DELETE",
  });
}

export function patchCloudWorldCells(worldId: string, diff: CellDiff) {
  return apiRequest<World>(`/api/worlds/${worldId}/cells`, {
    method: "PATCH",
    json: diff,
  });
}

export function replaceCloudWorldState(worldId: string, input: Pick<World, "grid" | "generation">) {
  return apiRequest<World>(`/api/worlds/${worldId}/state`, {
    method: "PUT",
    json: input,
  });
}
