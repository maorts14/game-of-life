import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ApiError, getErrorMessage, patternApi, preferencesApi, worldApi } from "../api/client";
import {
  applyCellBatch,
  cloneGrid,
  computeNextGeneration,
  createEmptyGrid,
  getPopulation,
  randomizeGrid,
  setCell,
} from "../features/game/engine";
import { insertPatternAt } from "../features/game/presets";
import type {
  Cell,
  CloudPattern,
  CloudWorld,
  Grid,
  LocalPattern,
  LocalWorld,
  PatternDefinition,
  Point,
  SavedPattern,
  StorageMode,
  UserPreferences,
  WorldRef,
  WorldSummary,
} from "../features/game/types";
import { createLocalWorldRecord, createId, toWorldSummary } from "../../../shared/src/game/worlds";

const FLUSH_DELAY_MS = 140;

interface CloudMutationState {
  pendingCells: Record<string, Cell>;
  inflightCells: Record<string, Cell>;
  flushTimerId: number | null;
  isFlushing: boolean;
}

interface PersistedState {
  localWorlds: Record<string, LocalWorld>;
  localPatterns: LocalPattern[];
  localSimulationSpeed: number;
  lastOpenedLocalWorldId: string | null;
  dismissedSyncPromptUserIds: string[];
}

interface GameState extends PersistedState {
  cloudWorlds: Record<string, CloudWorld>;
  cloudPatterns: CloudPattern[];
  cloudPreferences: UserPreferences | null;
  cloudWorldMutations: Record<string, CloudMutationState>;
  activeCloudUserId: string | null;
  isCloudHydrating: boolean;
  lastError: string | null;
  isRunning: boolean;
  hydrateCloudState: (token: string, userId: string) => Promise<void>;
  clearCloudState: () => void;
  ensureCloudWorld: (token: string, worldId: string) => Promise<CloudWorld | null>;
  createWorld: (input: {
    storageMode: StorageMode;
    name: string;
    width: number;
    height: number;
    token?: string | null;
  }) => Promise<WorldRef>;
  deleteWorld: (ref: WorldRef, token?: string | null) => Promise<void>;
  selectWorld: (ref: WorldRef, token?: string | null) => Promise<void>;
  updateGrid: (ref: WorldRef, grid: Grid, token?: string | null) => Promise<void>;
  stepWorld: (ref: WorldRef, token?: string | null) => Promise<void>;
  randomizeWorld: (ref: WorldRef, token?: string | null) => Promise<void>;
  clearWorld: (ref: WorldRef, token?: string | null) => Promise<void>;
  insertPatternIntoWorld: (
    ref: WorldRef,
    patternId: string,
    anchorX: number,
    anchorY: number,
    token?: string | null,
  ) => Promise<void>;
  addCustomPattern: (
    storageMode: StorageMode,
    pattern: PatternDefinition,
    token?: string | null,
  ) => Promise<void>;
  deleteCustomPattern: (
    storageMode: StorageMode,
    patternId: string,
    token?: string | null,
  ) => Promise<void>;
  setRunning: (isRunning: boolean) => void;
  setSpeed: (storageMode: StorageMode, speed: number, token?: string | null) => Promise<void>;
  syncLocalWorldToCloud: (localWorldId: string, token: string) => Promise<CloudWorld>;
  syncLocalPatternToCloud: (localPatternId: string, token: string) => Promise<CloudPattern>;
  markSyncPromptDismissed: (userId: string) => void;
  clearLastError: () => void;
}

const DEFAULT_PERSISTED_STATE: PersistedState = {
  localWorlds: {},
  localPatterns: [],
  localSimulationSpeed: 8,
  lastOpenedLocalWorldId: null,
  dismissedSyncPromptUserIds: [],
};

interface LegacyPersistedState {
  worlds?: Record<
    string,
    {
      id: string;
      name: string;
      width: number;
      height: number;
      grid: Grid;
      createdAt: string;
      updatedAt: string;
      generation: number;
    }
  >;
  customPatterns?: PatternDefinition[];
  currentWorldId?: string | null;
  speed?: number;
}

function readPersistStorage<T>(storageKey: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { state?: T };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

function loadInitialPersistedState(): PersistedState {
  const currentState = readPersistStorage<PersistedState>("game-of-life-state-v2");

  if (currentState) {
    return {
      ...DEFAULT_PERSISTED_STATE,
      ...currentState,
    };
  }

  const legacyState = readPersistStorage<LegacyPersistedState>("game-of-life-state");

  if (!legacyState) {
    return DEFAULT_PERSISTED_STATE;
  }

  return {
    localWorlds: Object.fromEntries(
      Object.entries(legacyState.worlds ?? {}).map(([worldId, world]) => [
        worldId,
        {
          ...world,
          storageMode: "local" as const,
          syncedCloudId: null,
          lastSyncedAt: null,
        },
      ]),
    ),
    localPatterns: (legacyState.customPatterns ?? []).map((pattern) => ({
      ...pattern,
      storageMode: "local" as const,
      syncedCloudId: null,
      lastSyncedAt: null,
    })),
    localSimulationSpeed: legacyState.speed ?? DEFAULT_PERSISTED_STATE.localSimulationSpeed,
    lastOpenedLocalWorldId: legacyState.currentWorldId ?? null,
    dismissedSyncPromptUserIds: [],
  };
}

function emptyMutationState(): CloudMutationState {
  return {
    pendingCells: {},
    inflightCells: {},
    flushTimerId: null,
    isFlushing: false,
  };
}

function buildCellKey(point: Point) {
  return `${point.x}:${point.y}`;
}

function decodeCellKey(key: string): Point {
  const [x, y] = key.split(":").map(Number);
  return { x, y };
}

function mergeCellMaps(
  ...maps: Array<Record<string, Cell> | undefined>
): Record<string, Cell> {
  return maps.reduce<Record<string, Cell>>((accumulator, current) => {
    if (!current) {
      return accumulator;
    }

    for (const [key, value] of Object.entries(current)) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

function applyPendingCells(grid: Grid, cells: Record<string, Cell>): Grid {
  return applyCellBatch(
    grid,
    Object.entries(cells).map(([key, value]) => ({
      ...decodeCellKey(key),
      value,
    })),
  );
}

function createLocalPattern(pattern: PatternDefinition): LocalPattern {
  return {
    ...pattern,
    id: pattern.id.startsWith("custom-") ? pattern.id : `custom-${createId("pattern")}`,
    storageMode: "local",
    syncedCloudId: null,
    lastSyncedAt: null,
  };
}

function diffGrids(current: Grid, next: Grid): Record<string, Cell> {
  const changes: Record<string, Cell> = {};

  for (let y = 0; y < next.length; y += 1) {
    for (let x = 0; x < (next[y]?.length ?? 0); x += 1) {
      if (current[y]?.[x] !== next[y]?.[x]) {
        changes[buildCellKey({ x, y })] = next[y][x];
      }
    }
  }

  return changes;
}

function ensureCloudToken(token?: string | null): string {
  if (!token) {
    throw new Error("Sign in required for cloud actions.");
  }

  return token;
}

function getWorldFromState(state: GameState, ref: WorldRef): LocalWorld | CloudWorld | null {
  return ref.storageMode === "local"
    ? state.localWorlds[ref.id] ?? null
    : state.cloudWorlds[ref.id] ?? null;
}

function applyConflictRecovery(worldId: string, latestWorld: CloudWorld | null, errorMessage?: string) {
  if (!latestWorld) {
    return;
  }

  useGameStore.setState((state) => {
    const mutation = state.cloudWorldMutations[worldId] ?? emptyMutationState();
    const mergedPending = mergeCellMaps(mutation.inflightCells, mutation.pendingCells);
    const rebasedWorld = {
      ...latestWorld,
      grid: applyPendingCells(latestWorld.grid, mergedPending),
    };

    return {
      cloudWorlds: {
        ...state.cloudWorlds,
        [worldId]: rebasedWorld,
      },
      cloudWorldMutations: {
        ...state.cloudWorldMutations,
        [worldId]: {
          pendingCells: mergedPending,
          inflightCells: {},
          flushTimerId: null,
          isFlushing: false,
        },
      },
      lastError: errorMessage ?? state.lastError,
    };
  });
}

async function flushCloudCells(worldId: string, token: string): Promise<void> {
  const state = useGameStore.getState();
  const mutation = state.cloudWorldMutations[worldId] ?? emptyMutationState();
  const world = state.cloudWorlds[worldId];

  if (!world || mutation.isFlushing || Object.keys(mutation.pendingCells).length === 0) {
    return;
  }

  if (mutation.flushTimerId !== null) {
    window.clearTimeout(mutation.flushTimerId);
  }

  const pendingSnapshot = mutation.pendingCells;

  useGameStore.setState((nextState) => ({
    cloudWorldMutations: {
      ...nextState.cloudWorldMutations,
      [worldId]: {
        pendingCells: {},
        inflightCells: pendingSnapshot,
        flushTimerId: null,
        isFlushing: true,
      },
    },
  }));

  try {
    const updatedWorld = await worldApi.patchCells(token, worldId, {
      setAlive: Object.entries(pendingSnapshot)
        .filter(([, value]) => value === 1)
        .map(([key]) => decodeCellKey(key)),
      setDead: Object.entries(pendingSnapshot)
        .filter(([, value]) => value === 0)
        .map(([key]) => decodeCellKey(key)),
      expectedVersion: world.version,
    });

    useGameStore.setState((currentState) => {
      const currentMutation = currentState.cloudWorldMutations[worldId] ?? emptyMutationState();
      return {
        cloudWorlds: {
          ...currentState.cloudWorlds,
          [worldId]: {
            ...updatedWorld,
            grid: applyPendingCells(updatedWorld.grid, currentMutation.pendingCells),
          },
        },
        cloudWorldMutations: {
          ...currentState.cloudWorldMutations,
          [worldId]: {
            ...currentMutation,
            inflightCells: {},
            isFlushing: false,
            flushTimerId: null,
          },
        },
      };
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      applyConflictRecovery(worldId, (error.details as { latestWorld?: CloudWorld })?.latestWorld ?? null);
    } else {
      useGameStore.setState((currentState) => {
        const currentMutation = currentState.cloudWorldMutations[worldId] ?? emptyMutationState();
        return {
          cloudWorldMutations: {
            ...currentState.cloudWorldMutations,
            [worldId]: {
              pendingCells: mergeCellMaps(currentMutation.inflightCells, currentMutation.pendingCells),
              inflightCells: {},
              flushTimerId: null,
              isFlushing: false,
            },
          },
          lastError: getErrorMessage(error),
        };
      });
    }
  }

  const nextMutation = useGameStore.getState().cloudWorldMutations[worldId] ?? emptyMutationState();

  if (Object.keys(nextMutation.pendingCells).length > 0) {
    scheduleCloudFlush(worldId, token);
  }
}

function scheduleCloudFlush(worldId: string, token: string) {
  if (typeof window === "undefined") {
    return;
  }

  const current = useGameStore.getState().cloudWorldMutations[worldId] ?? emptyMutationState();

  if (current.flushTimerId !== null) {
    return;
  }

  const timerId = window.setTimeout(() => {
    void flushCloudCells(worldId, token);
  }, FLUSH_DELAY_MS);

  useGameStore.setState((state) => ({
    cloudWorldMutations: {
      ...state.cloudWorldMutations,
      [worldId]: {
        ...current,
        flushTimerId: timerId,
      },
    },
  }));
}

async function flushCloudWorldNow(worldId: string, token: string) {
  const mutation = useGameStore.getState().cloudWorldMutations[worldId] ?? emptyMutationState();

  if (mutation.flushTimerId !== null) {
    window.clearTimeout(mutation.flushTimerId);
    useGameStore.setState((state) => ({
      cloudWorldMutations: {
        ...state.cloudWorldMutations,
        [worldId]: {
          ...mutation,
          flushTimerId: null,
        },
      },
    }));
  }

  await flushCloudCells(worldId, token);
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...loadInitialPersistedState(),
      cloudWorlds: {},
      cloudPatterns: [],
      cloudPreferences: null,
      cloudWorldMutations: {},
      activeCloudUserId: null,
      isCloudHydrating: false,
      lastError: null,
      isRunning: false,
      async hydrateCloudState(token, userId) {
        if (get().activeCloudUserId === userId && !get().isCloudHydrating) {
          return;
        }

        set({
          isCloudHydrating: true,
          lastError: null,
        });

        try {
          const [cloudWorlds, cloudPatterns, cloudPreferences] = await Promise.all([
            worldApi.list(token),
            patternApi.list(token, "mine"),
            preferencesApi.get(token),
          ]);

          const worldRecords = await Promise.all(
            cloudWorlds.map(async (summary) => worldApi.get(token, summary.id)),
          );

          set({
            activeCloudUserId: userId,
            isCloudHydrating: false,
            cloudWorlds: Object.fromEntries(worldRecords.map((world) => [world.id, world])),
            cloudPatterns: cloudPatterns as CloudPattern[],
            cloudPreferences,
            cloudWorldMutations: {},
          });
        } catch (error) {
          set({
            isCloudHydrating: false,
            lastError: getErrorMessage(error),
          });
        }
      },
      clearCloudState() {
        const timers = Object.values(get().cloudWorldMutations)
          .map((mutation) => mutation.flushTimerId)
          .filter((timerId): timerId is number => timerId !== null);

        for (const timerId of timers) {
          window.clearTimeout(timerId);
        }

        set({
          cloudWorlds: {},
          cloudPatterns: [],
          cloudPreferences: null,
          cloudWorldMutations: {},
          activeCloudUserId: null,
          isCloudHydrating: false,
        });
      },
      async ensureCloudWorld(token, worldId) {
        const existing = get().cloudWorlds[worldId];

        if (existing) {
          return existing;
        }

        try {
          const world = await worldApi.get(token, worldId);
          set((state) => ({
            cloudWorlds: {
              ...state.cloudWorlds,
              [worldId]: world,
            },
          }));
          return world;
        } catch (error) {
          set({
            lastError: getErrorMessage(error),
          });
          return null;
        }
      },
      async createWorld({ storageMode, name, width, height, token }) {
        if (storageMode === "local") {
          const world = createLocalWorldRecord(name, width, height);
          set((state) => ({
            localWorlds: {
              ...state.localWorlds,
              [world.id]: world,
            },
            lastOpenedLocalWorldId: world.id,
          }));

          return {
            storageMode: "local",
            id: world.id,
          };
        }

        const accessToken = ensureCloudToken(token);
        const world = await worldApi.create(accessToken, {
          name,
          width,
          height,
        });

        set((state) => ({
          cloudWorlds: {
            ...state.cloudWorlds,
            [world.id]: world,
          },
          cloudWorldMutations: {
            ...state.cloudWorldMutations,
            [world.id]: state.cloudWorldMutations[world.id] ?? emptyMutationState(),
          },
        }));

        await get().selectWorld(
          {
            storageMode: "cloud",
            id: world.id,
          },
          accessToken,
        );

        return {
          storageMode: "cloud",
          id: world.id,
        };
      },
      async deleteWorld(ref, token) {
        if (ref.storageMode === "local") {
          set((state) => {
            if (!state.localWorlds[ref.id]) {
              return state;
            }

            const nextWorlds = { ...state.localWorlds };
            delete nextWorlds[ref.id];

            return {
              localWorlds: nextWorlds,
              lastOpenedLocalWorldId:
                state.lastOpenedLocalWorldId === ref.id ? null : state.lastOpenedLocalWorldId,
              isRunning: false,
            };
          });
          return;
        }

        const accessToken = ensureCloudToken(token);
        await flushCloudWorldNow(ref.id, accessToken);
        await worldApi.delete(accessToken, ref.id);

        set((state) => {
          const nextWorlds = { ...state.cloudWorlds };
          const nextMutations = { ...state.cloudWorldMutations };
          delete nextWorlds[ref.id];
          delete nextMutations[ref.id];

          return {
            cloudWorlds: nextWorlds,
            cloudWorldMutations: nextMutations,
            isRunning: false,
          };
        });

        if (get().cloudPreferences?.lastOpenedCloudWorldId === ref.id) {
          await preferencesApi.update(accessToken, {
            lastOpenedCloudWorldId: null,
          });
          set((state) => ({
            cloudPreferences: state.cloudPreferences
              ? {
                  ...state.cloudPreferences,
                  lastOpenedCloudWorldId: null,
                }
              : state.cloudPreferences,
          }));
        }
      },
      async selectWorld(ref, token) {
        if (ref.storageMode === "local") {
          set({
            lastOpenedLocalWorldId: ref.id,
          });
          return;
        }

        const accessToken = ensureCloudToken(token);
        const preferences = await preferencesApi.update(accessToken, {
          lastOpenedCloudWorldId: ref.id,
        });

        set({
          cloudPreferences: preferences,
        });
      },
      async updateGrid(ref, grid, token) {
        if (ref.storageMode === "local") {
          set((state) => ({
            localWorlds: {
              ...state.localWorlds,
              [ref.id]: {
                ...state.localWorlds[ref.id],
                grid,
                updatedAt: new Date().toISOString(),
              },
            },
          }));
          return;
        }

        const accessToken = ensureCloudToken(token);
        const world = get().cloudWorlds[ref.id];

        if (!world) {
          return;
        }

        const diff = diffGrids(world.grid, grid);

        if (Object.keys(diff).length === 0) {
          return;
        }

        set((state) => {
          const currentMutation = state.cloudWorldMutations[ref.id] ?? emptyMutationState();

          return {
            cloudWorlds: {
              ...state.cloudWorlds,
              [ref.id]: {
                ...world,
                grid,
                updatedAt: new Date().toISOString(),
              },
            },
            cloudWorldMutations: {
              ...state.cloudWorldMutations,
              [ref.id]: {
                ...currentMutation,
                pendingCells: mergeCellMaps(currentMutation.pendingCells, diff),
              },
            },
          };
        });

        scheduleCloudFlush(ref.id, accessToken);
      },
      async stepWorld(ref, token) {
        if (ref.storageMode === "local") {
          set((state) => ({
            localWorlds: {
              ...state.localWorlds,
              [ref.id]: {
                ...state.localWorlds[ref.id],
                grid: computeNextGeneration(state.localWorlds[ref.id].grid),
                generation: state.localWorlds[ref.id].generation + 1,
                updatedAt: new Date().toISOString(),
              },
            },
          }));
          return;
        }

        const accessToken = ensureCloudToken(token);
        await flushCloudWorldNow(ref.id, accessToken);
        const world = get().cloudWorlds[ref.id];

        if (!world) {
          return;
        }

        try {
          const updated = await worldApi.step(accessToken, ref.id, world.version);
          set((state) => ({
            cloudWorlds: {
              ...state.cloudWorlds,
              [ref.id]: updated,
            },
          }));
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            applyConflictRecovery(ref.id, (error.details as { latestWorld?: CloudWorld })?.latestWorld ?? null);
          } else {
            set({
              lastError: getErrorMessage(error),
            });
          }
        }
      },
      async randomizeWorld(ref, token) {
        if (ref.storageMode === "local") {
          set((state) => ({
            localWorlds: {
              ...state.localWorlds,
              [ref.id]: {
                ...state.localWorlds[ref.id],
                grid: randomizeGrid(state.localWorlds[ref.id].width, state.localWorlds[ref.id].height),
                generation: 0,
                updatedAt: new Date().toISOString(),
              },
            },
          }));
          return;
        }

        const accessToken = ensureCloudToken(token);
        await flushCloudWorldNow(ref.id, accessToken);
        const world = get().cloudWorlds[ref.id];

        if (!world) {
          return;
        }

        try {
          const updated = await worldApi.randomize(accessToken, ref.id, world.version);
          set((state) => ({
            cloudWorlds: {
              ...state.cloudWorlds,
              [ref.id]: updated,
            },
          }));
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            applyConflictRecovery(ref.id, (error.details as { latestWorld?: CloudWorld })?.latestWorld ?? null);
          } else {
            set({
              lastError: getErrorMessage(error),
            });
          }
        }
      },
      async clearWorld(ref, token) {
        if (ref.storageMode === "local") {
          set((state) => ({
            localWorlds: {
              ...state.localWorlds,
              [ref.id]: {
                ...state.localWorlds[ref.id],
                grid: createEmptyGrid(state.localWorlds[ref.id].width, state.localWorlds[ref.id].height),
                generation: 0,
                updatedAt: new Date().toISOString(),
              },
            },
          }));
          return;
        }

        const accessToken = ensureCloudToken(token);
        await flushCloudWorldNow(ref.id, accessToken);
        const world = get().cloudWorlds[ref.id];

        if (!world) {
          return;
        }

        try {
          const updated = await worldApi.clear(accessToken, ref.id, world.version);
          set((state) => ({
            cloudWorlds: {
              ...state.cloudWorlds,
              [ref.id]: updated,
            },
          }));
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            applyConflictRecovery(ref.id, (error.details as { latestWorld?: CloudWorld })?.latestWorld ?? null);
          } else {
            set({
              lastError: getErrorMessage(error),
            });
          }
        }
      },
      async insertPatternIntoWorld(ref, patternId, anchorX, anchorY, token) {
        if (ref.storageMode === "local") {
          set((state) => {
            const world = state.localWorlds[ref.id];
            return {
              localWorlds: {
                ...state.localWorlds,
                [ref.id]: {
                  ...world,
                  grid: insertPatternAt(cloneGrid(world.grid), patternId, anchorX, anchorY, state.localPatterns),
                  updatedAt: new Date().toISOString(),
                },
              },
            };
          });
          return;
        }

        const accessToken = ensureCloudToken(token);
        await flushCloudWorldNow(ref.id, accessToken);
        const world = get().cloudWorlds[ref.id];

        if (!world) {
          return;
        }

        try {
          const updated = await worldApi.applyPattern(accessToken, ref.id, {
            patternId,
            anchorX,
            anchorY,
            expectedVersion: world.version,
          });
          set((state) => ({
            cloudWorlds: {
              ...state.cloudWorlds,
              [ref.id]: updated,
            },
          }));
        } catch (error) {
          if (error instanceof ApiError && error.status === 409) {
            applyConflictRecovery(ref.id, (error.details as { latestWorld?: CloudWorld })?.latestWorld ?? null);
          } else {
            set({
              lastError: getErrorMessage(error),
            });
          }
        }
      },
      async addCustomPattern(storageMode, pattern, token) {
        if (storageMode === "local") {
          set((state) => ({
            localPatterns: [...state.localPatterns, createLocalPattern(pattern)],
          }));
          return;
        }

        const accessToken = ensureCloudToken(token);
        const createdPattern = await patternApi.create(accessToken, {
          name: pattern.name,
          description: pattern.description,
          width: pattern.width,
          height: pattern.height,
          cells: pattern.cells,
        });

        set((state) => ({
          cloudPatterns: [createdPattern, ...state.cloudPatterns],
        }));
      },
      async deleteCustomPattern(storageMode, patternId, token) {
        if (storageMode === "local") {
          set((state) => ({
            localPatterns: state.localPatterns.filter((pattern) => pattern.id !== patternId),
          }));
          return;
        }

        const accessToken = ensureCloudToken(token);
        await patternApi.delete(accessToken, patternId);

        set((state) => ({
          cloudPatterns: state.cloudPatterns.filter((pattern) => pattern.id !== patternId),
        }));
      },
      setRunning(isRunning) {
        set({
          isRunning,
        });
      },
      async setSpeed(storageMode, speed, token) {
        if (storageMode === "local") {
          set({
            localSimulationSpeed: speed,
          });
          return;
        }

        const accessToken = ensureCloudToken(token);
        const preferences = await preferencesApi.update(accessToken, {
          simulationSpeed: speed,
        });

        set({
          cloudPreferences: preferences,
        });
      },
      async syncLocalWorldToCloud(localWorldId, token) {
        const localWorld = get().localWorlds[localWorldId];

        if (!localWorld) {
          throw new Error("Local world not found.");
        }

        const createdWorld = await worldApi.create(token, {
          name: localWorld.name,
          width: localWorld.width,
          height: localWorld.height,
          grid: localWorld.grid,
          generation: localWorld.generation,
        });

        const now = new Date().toISOString();

        set((state) => ({
          localWorlds: {
            ...state.localWorlds,
            [localWorldId]: {
              ...localWorld,
              syncedCloudId: createdWorld.id,
              lastSyncedAt: now,
            },
          },
          cloudWorlds: {
            ...state.cloudWorlds,
            [createdWorld.id]: createdWorld,
          },
        }));

        return createdWorld;
      },
      async syncLocalPatternToCloud(localPatternId, token) {
        const pattern = get().localPatterns.find((item) => item.id === localPatternId);

        if (!pattern) {
          throw new Error("Local pattern not found.");
        }

        const createdPattern = await patternApi.create(token, {
          name: pattern.name,
          description: pattern.description,
          width: pattern.width,
          height: pattern.height,
          cells: pattern.cells,
        });

        const now = new Date().toISOString();

        set((state) => ({
          localPatterns: state.localPatterns.map((item) =>
            item.id === localPatternId
              ? {
                  ...item,
                  syncedCloudId: createdPattern.id,
                  lastSyncedAt: now,
                }
              : item,
          ),
          cloudPatterns: [createdPattern, ...state.cloudPatterns],
        }));

        return createdPattern;
      },
      markSyncPromptDismissed(userId) {
        set((state) => ({
          dismissedSyncPromptUserIds: state.dismissedSyncPromptUserIds.includes(userId)
            ? state.dismissedSyncPromptUserIds
            : [...state.dismissedSyncPromptUserIds, userId],
        }));
      },
      clearLastError() {
        set({
          lastError: null,
        });
      },
    }),
    {
      name: "game-of-life-state-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        localWorlds: state.localWorlds,
        localPatterns: state.localPatterns,
        localSimulationSpeed: state.localSimulationSpeed,
        lastOpenedLocalWorldId: state.lastOpenedLocalWorldId,
        dismissedSyncPromptUserIds: state.dismissedSyncPromptUserIds,
      }),
    },
  ),
);

export function useWorldSummaries(): WorldSummary[] {
  const localWorlds = useGameStore((state) => state.localWorlds);
  const cloudWorlds = useGameStore((state) => state.cloudWorlds);

  return useMemo(
    () =>
      [...Object.values(localWorlds).map((world) => toWorldSummary(world)), ...Object.values(cloudWorlds).map((world) => toWorldSummary(world))]
        .sort((left, right) => new Date(right.updatedAt).valueOf() - new Date(left.updatedAt).valueOf()),
    [cloudWorlds, localWorlds],
  );
}

export function useSelectedWorld(ref: WorldRef | null): LocalWorld | CloudWorld | null {
  return useGameStore((state) => (ref ? getWorldFromState(state, ref) : null));
}

export function usePatterns(storageMode: StorageMode): SavedPattern[] {
  return useGameStore((state) =>
    storageMode === "local" ? state.localPatterns : state.cloudPatterns,
  );
}

export function usePopulation(ref: WorldRef | null): number {
  return useGameStore((state) => {
    if (!ref) {
      return 0;
    }

    const world = getWorldFromState(state, ref);
    return world ? getPopulation(world.grid) : 0;
  });
}

export function useSimulationSpeed(storageMode: StorageMode): number {
  return useGameStore((state) =>
    storageMode === "local"
      ? state.localSimulationSpeed
      : state.cloudPreferences?.simulationSpeed ?? state.localSimulationSpeed,
  );
}

export function useUnsyncedLocalItems() {
  const localWorlds = useGameStore((state) => Object.values(state.localWorlds));
  const localPatterns = useGameStore((state) => state.localPatterns);

  return useMemo(
    () => ({
      worlds: localWorlds.filter((world) => !world.syncedCloudId),
      patterns: localPatterns.filter((pattern) => !pattern.syncedCloudId),
    }),
    [localPatterns, localWorlds],
  );
}

export function useSyncPromptDismissed(userId: string | null | undefined): boolean {
  return useGameStore((state) =>
    userId ? state.dismissedSyncPromptUserIds.includes(userId) : false,
  );
}

export function paintCell(grid: Grid, x: number, y: number, value: 0 | 1): Grid {
  return setCell(grid, x, y, value);
}
