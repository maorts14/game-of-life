import {
  BUILTIN_PATTERNS,
  cloneGrid,
  computeNextGeneration,
  createCellDiffFromGrids,
  createEmptyGrid,
  DEFAULT_SIMULATION_SPEED,
  getPopulation,
  insertPatternAt,
  randomizeGrid,
  setCell,
  type PatternDefinition,
  type World,
} from "@game-of-life/shared-game";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as patternsApi from "../lib/api/patternsApi";
import * as preferencesApi from "../lib/api/preferencesApi";
import * as worldsApi from "../lib/api/worldsApi";

const CELL_PATCH_DEBOUNCE_MS = 180;
const RUNNING_AUTOSAVE_MS = 2000;

function isSameGrid(left: World["grid"], right: World["grid"]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let y = 0; y < left.length; y += 1) {
    if ((left[y]?.length ?? 0) !== (right[y]?.length ?? 0)) {
      return false;
    }

    for (let x = 0; x < (left[y]?.length ?? 0); x += 1) {
      if (left[y][x] !== right[y][x]) {
        return false;
      }
    }
  }

  return true;
}

export function useCloudGameSession(worldId: string | undefined, enabled: boolean) {
  const navigate = useNavigate();
  const [world, setWorld] = useState<World | null>(null);
  const [customPatterns, setCustomPatterns] = useState<PatternDefinition[]>([]);
  const [speed, setSpeed] = useState(DEFAULT_SIMULATION_SPEED);
  const [isRunning, setRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const worldRef = useRef<World | null>(null);
  const pendingCellChangesRef = useRef<Map<string, 0 | 1>>(new Map());
  const flushTimerRef = useRef<number | null>(null);
  const wasRunningRef = useRef(false);

  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  const flushPendingCellDiff = useEffectEvent(async () => {
    if (!worldRef.current || pendingCellChangesRef.current.size === 0) {
      return;
    }

    const entries = Array.from(pendingCellChangesRef.current.entries());
    pendingCellChangesRef.current.clear();
    const setAlive: Array<[number, number]> = [];
    const setDead: Array<[number, number]> = [];

    for (const [key, value] of entries) {
      const [x, y] = key.split(":").map((part) => Number(part));

      if (value === 1) {
        setAlive.push([x, y]);
      } else {
        setDead.push([x, y]);
      }
    }

    try {
      const response = await worldsApi.patchCloudWorldCells(worldRef.current.id, {
        setAlive,
        setDead,
      });

      setWorld((current) => {
        if (!current || current.id !== response.id) {
          return current;
        }

        return {
          ...current,
          updatedAt: response.updatedAt,
          version: response.version,
        };
      });
    } catch (error) {
      for (const [x, y] of setAlive) {
        pendingCellChangesRef.current.set(`${x}:${y}`, 1);
      }

      for (const [x, y] of setDead) {
        pendingCellChangesRef.current.set(`${x}:${y}`, 0);
      }

      setErrorMessage(error instanceof Error ? error.message : "Unable to sync cell edits.");
    }
  });

  const saveState = useEffectEvent(async (snapshot: World | null = worldRef.current) => {
    if (!snapshot) {
      return;
    }

    pendingCellChangesRef.current.clear();
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    try {
      const response = await worldsApi.replaceCloudWorldState(snapshot.id, {
        grid: snapshot.grid,
        generation: snapshot.generation,
      });

      setWorld((current) => {
        if (
          !current ||
          current.id !== response.id ||
          current.generation !== snapshot.generation ||
          !isSameGrid(current.grid, snapshot.grid)
        ) {
          return current;
        }

        return {
          ...current,
          updatedAt: response.updatedAt,
          version: response.version,
        };
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save world state.");
    }
  });

  function schedulePendingCellFlush() {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
    }

    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      void flushPendingCellDiff();
    }, CELL_PATCH_DEBOUNCE_MS);
  }

  function queueCellDiff(diff: ReturnType<typeof createCellDiffFromGrids>) {
    for (const [x, y] of diff.setAlive) {
      pendingCellChangesRef.current.set(`${x}:${y}`, 1);
    }

    for (const [x, y] of diff.setDead) {
      pendingCellChangesRef.current.set(`${x}:${y}`, 0);
    }

    schedulePendingCellFlush();
  }

  useEffect(() => {
    if (!enabled || !worldId) {
      setWorld(null);
      setCustomPatterns([]);
      setSpeed(DEFAULT_SIMULATION_SPEED);
      setRunning(false);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([
      worldsApi.getCloudWorld(worldId),
      patternsApi.listCloudPatterns(),
      preferencesApi.getCloudPreferences(),
    ])
      .then(async ([nextWorld, patterns, preferences]) => {
        if (!isMounted) {
          return;
        }

        setWorld(nextWorld);
        setCustomPatterns(patterns.filter((pattern) => !pattern.isBuiltin));
        setSpeed(preferences.simulationSpeed);
        await preferencesApi.saveCloudPreferences({
          simulationSpeed: preferences.simulationSpeed,
          lastOpenedWorldId: nextWorld.id,
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unable to load cloud world.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      void saveState(worldRef.current);
    };
  }, [enabled, saveState, worldId]);

  useEffect(() => {
    if (!enabled || !worldRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void preferencesApi.saveCloudPreferences({
        simulationSpeed: speed,
        lastOpenedWorldId: worldRef.current?.id ?? null,
      });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, speed]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!isRunning) {
      if (wasRunningRef.current) {
        void saveState(worldRef.current);
      }

      wasRunningRef.current = false;
      return;
    }

    wasRunningRef.current = true;
    const intervalId = window.setInterval(() => {
      void saveState(worldRef.current);
    }, RUNNING_AUTOSAVE_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled, isRunning, saveState]);

  return useMemo(
    () => ({
      source: "cloud" as const,
      world,
      customPatterns,
      population: world ? getPopulation(world.grid) : 0,
      speed,
      isRunning,
      isLoading,
      errorMessage,
      setRunning,
      setSpeed,
      updateGrid(updater: (currentGrid: World["grid"]) => World["grid"]) {
        setWorld((current) => {
          if (!current) {
            return current;
          }

          const nextGrid = updater(current.grid);

          if (isSameGrid(current.grid, nextGrid)) {
            return current;
          }

          queueCellDiff(createCellDiffFromGrids(current.grid, nextGrid));
          return {
            ...current,
            grid: nextGrid,
            updatedAt: new Date().toISOString(),
          };
        });
      },
      stepWorld() {
        setWorld((current) => {
          if (!current) {
            return current;
          }

          const nextWorld = {
            ...current,
            grid: computeNextGeneration(current.grid),
            generation: current.generation + 1,
            updatedAt: new Date().toISOString(),
          };
          void saveState(nextWorld);
          return nextWorld;
        });
      },
      randomizeWorld() {
        setWorld((current) => {
          if (!current) {
            return current;
          }

          const nextWorld = {
            ...current,
            grid: randomizeGrid(current.width, current.height),
            generation: 0,
            updatedAt: new Date().toISOString(),
          };
          void saveState(nextWorld);
          return nextWorld;
        });
      },
      clearWorld() {
        setWorld((current) => {
          if (!current) {
            return current;
          }

          const nextWorld = {
            ...current,
            grid: createEmptyGrid(current.width, current.height),
            generation: 0,
            updatedAt: new Date().toISOString(),
          };
          void saveState(nextWorld);
          return nextWorld;
        });
      },
      insertPatternIntoWorld(patternId: string, anchorX: number, anchorY: number) {
        setWorld((current) => {
          if (!current) {
            return current;
          }

          const nextGrid = insertPatternAt(
            cloneGrid(current.grid),
            patternId,
            anchorX,
            anchorY,
            customPatterns,
          );

          if (isSameGrid(current.grid, nextGrid)) {
            return current;
          }

          queueCellDiff(createCellDiffFromGrids(current.grid, nextGrid));
          return {
            ...current,
            grid: nextGrid,
            updatedAt: new Date().toISOString(),
          };
        });
      },
      async addCustomPattern(pattern: PatternDefinition) {
        const createdPattern = await patternsApi.createCloudPattern({
          name: pattern.name,
          description: pattern.description,
          width: pattern.width,
          height: pattern.height,
          cells: pattern.cells,
        });

        setCustomPatterns((current) => [createdPattern, ...current]);
      },
      async deleteCustomPattern(patternId: string) {
        await patternsApi.deleteCloudPattern(patternId);
        setCustomPatterns((current) => current.filter((pattern) => pattern.id !== patternId));
      },
      async deleteWorld() {
        if (!worldRef.current) {
          return;
        }

        await worldsApi.deleteCloudWorld(worldRef.current.id);
        navigate("/worlds?mode=cloud", { replace: true });
      },
      forceSave() {
        void saveState(worldRef.current);
      },
    }),
    [
      customPatterns,
      errorMessage,
      isLoading,
      isRunning,
      navigate,
      saveState,
      speed,
      world,
    ],
  );
}
