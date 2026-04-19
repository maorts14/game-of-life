import type { StorageMode, WorldRef } from "../features/game/types";

export function getWorldRoute(ref: WorldRef): string {
  return `/game/${ref.storageMode}/${ref.id}`;
}

export function parseWorldRef(storageMode: string | undefined, id: string | undefined): WorldRef | null {
  if (!id) {
    return null;
  }

  if (storageMode === "local" || storageMode === "cloud") {
    return {
      storageMode,
      id,
    };
  }

  return null;
}

export function isStorageMode(value: string | undefined): value is StorageMode {
  return value === "local" || value === "cloud";
}
