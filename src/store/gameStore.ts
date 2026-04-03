import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  cloneGrid,
  computeNextGeneration,
  createEmptyGrid,
  getPopulation,
  randomizeGrid,
  setCell,
} from "../features/game/engine";
import { seedGlider } from "../features/game/presets";
import type { Grid, World, WorldSummary } from "../features/game/types";

const DEFAULT_WORLD_NAME = "Void Core";

interface GameState {
  worlds: Record<string, World>;
  currentWorldId: string | null;
  isRunning: boolean;
  speed: number;
  createWorld: (params: { name: string; width: number; height: number }) => string;
  selectWorld: (worldId: string) => void;
  updateGrid: (worldId: string, grid: Grid) => void;
  stepWorld: (worldId: string) => void;
  randomizeWorld: (worldId: string) => void;
  clearWorld: (worldId: string) => void;
  seedWorldGlider: (worldId: string) => void;
  setRunning: (isRunning: boolean) => void;
  setSpeed: (speed: number) => void;
}

function createWorldRecord(name: string, width: number, height: number): World {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name.trim() || DEFAULT_WORLD_NAME,
    width,
    height,
    grid: createEmptyGrid(width, height),
    createdAt: now,
    updatedAt: now,
    generation: 0,
  };
}

function withUpdatedWorld(
  worlds: Record<string, World>,
  worldId: string,
  updater: (world: World) => World,
): Record<string, World> {
  const world = worlds[worldId];

  if (!world) {
    return worlds;
  }

  return {
    ...worlds,
    [worldId]: updater(world),
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      worlds: {},
      currentWorldId: null,
      isRunning: false,
      speed: 8,
      createWorld: ({ name, width, height }) => {
        const world = createWorldRecord(name, width, height);

        set((state) => ({
          worlds: {
            ...state.worlds,
            [world.id]: world,
          },
          currentWorldId: world.id,
        }));

        return world.id;
      },
      selectWorld: (worldId) =>
        set({
          currentWorldId: worldId,
        }),
      updateGrid: (worldId, grid) =>
        set((state) => ({
          worlds: withUpdatedWorld(state.worlds, worldId, (world) => ({
            ...world,
            grid,
            updatedAt: new Date().toISOString(),
          })),
        })),
      stepWorld: (worldId) =>
        set((state) => ({
          worlds: withUpdatedWorld(state.worlds, worldId, (world) => ({
            ...world,
            grid: computeNextGeneration(world.grid),
            generation: world.generation + 1,
            updatedAt: new Date().toISOString(),
          })),
        })),
      randomizeWorld: (worldId) =>
        set((state) => ({
          worlds: withUpdatedWorld(state.worlds, worldId, (world) => ({
            ...world,
            grid: randomizeGrid(world.width, world.height),
            generation: 0,
            updatedAt: new Date().toISOString(),
          })),
        })),
      clearWorld: (worldId) =>
        set((state) => ({
          worlds: withUpdatedWorld(state.worlds, worldId, (world) => ({
            ...world,
            grid: createEmptyGrid(world.width, world.height),
            generation: 0,
            updatedAt: new Date().toISOString(),
          })),
        })),
      seedWorldGlider: (worldId) =>
        set((state) => ({
          worlds: withUpdatedWorld(state.worlds, worldId, (world) => ({
            ...world,
            grid: seedGlider(cloneGrid(world.grid)),
            updatedAt: new Date().toISOString(),
          })),
        })),
      setRunning: (isRunning) => set({ isRunning }),
      setSpeed: (speed) => set({ speed }),
    }),
    {
      name: "game-of-life-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        worlds: state.worlds,
        currentWorldId: state.currentWorldId,
        speed: state.speed,
      }),
    },
  ),
);

export function useWorldSummaries(): WorldSummary[] {
  return useGameStore((state) =>
    Object.values(state.worlds)
      .sort((a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf())
      .map((world) => ({
        id: world.id,
        name: world.name,
        width: world.width,
        height: world.height,
        updatedAt: world.updatedAt,
        generation: world.generation,
      })),
  );
}

export function useSelectedWorld(worldId: string | undefined): World | null {
  return useGameStore((state) => (worldId ? state.worlds[worldId] ?? null : null));
}

export function usePopulation(worldId: string | undefined): number {
  return useGameStore((state) =>
    worldId && state.worlds[worldId] ? getPopulation(state.worlds[worldId].grid) : 0,
  );
}

export function paintCell(grid: Grid, x: number, y: number, value: 0 | 1): Grid {
  return setCell(grid, x, y, value);
}
