import { useEffect, useState } from "react";
import type { WorldSummary } from "@game-of-life/shared-game";
import * as worldsApi from "../lib/api/worldsApi";
import { ApiError } from "../lib/api/http";

export function useCloudWorlds(enabled: boolean) {
  const [worlds, setWorlds] = useState<WorldSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refresh() {
    if (!enabled) {
      setWorlds([]);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextWorlds = await worldsApi.listCloudWorlds();
      setWorlds(nextWorlds);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setWorlds([]);
        setErrorMessage(null);
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load cloud worlds.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [enabled]);

  return {
    worlds,
    isLoading,
    errorMessage,
    refresh,
    async createWorld(input: { name: string; width: number; height: number }) {
      const world = await worldsApi.createCloudWorld(input);
      setWorlds((current) =>
        [world, ...current.filter((item) => item.id !== world.id)].sort(
          (left, right) =>
            new Date(right.updatedAt).valueOf() - new Date(left.updatedAt).valueOf(),
        ),
      );
      return world;
    },
    async deleteWorld(worldId: string) {
      await worldsApi.deleteCloudWorld(worldId);
      setWorlds((current) => current.filter((world) => world.id !== worldId));
    },
  };
}
