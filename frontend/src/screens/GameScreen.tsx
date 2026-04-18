import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Gauge,
  LocateFixed,
  Pause,
  Play,
  Plus,
  Shuffle,
  StepForward,
  Trash2,
  X,
} from "lucide-react";
import {
  BUILTIN_PATTERNS,
  createPatternFromSelection,
  getPopulation,
  setCell,
  type Grid,
  type PatternDefinition,
  type World,
  type WorldSource,
} from "@game-of-life/shared-game";
import { Navigate, useParams } from "react-router-dom";
import { GameCanvas } from "../components/GameCanvas";
import type { GameCanvasHandle } from "../components/GameCanvas";
import { PatternSaveModal } from "../components/PatternSaveModal";
import { ResponsiveIconButton } from "../components/ResponsiveIconButton";
import { useCloudGameSession } from "../hooks/useCloudGameSession";
import { useGameStore, usePatterns, useSelectedWorld } from "../store/gameStore";

interface GameScreenProps {
  source: WorldSource;
}

interface GameSessionController {
  source: WorldSource;
  world: World | null;
  customPatterns: PatternDefinition[];
  population: number;
  speed: number;
  isRunning: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  setRunning: (isRunning: boolean) => void;
  setSpeed: (speed: number) => void;
  updateGrid: (updater: (grid: Grid) => Grid) => void;
  stepWorld: () => void;
  randomizeWorld: () => void;
  clearWorld: () => void;
  insertPatternIntoWorld: (patternId: string, anchorX: number, anchorY: number) => void;
  addCustomPattern: (pattern: PatternDefinition) => Promise<void> | void;
  deleteCustomPattern: (patternId: string) => Promise<void> | void;
  forceSave: () => void;
}

function useLocalGameSession(worldId: string | undefined): GameSessionController {
  const world = useSelectedWorld(worldId);
  const customPatterns = usePatterns();
  const isRunning = useGameStore((state) => state.isRunning);
  const speed = useGameStore((state) => state.speed);
  const updateGridWith = useGameStore((state) => state.updateGridWith);
  const stepWorldAction = useGameStore((state) => state.stepWorld);
  const randomizeWorldAction = useGameStore((state) => state.randomizeWorld);
  const clearWorldAction = useGameStore((state) => state.clearWorld);
  const setRunning = useGameStore((state) => state.setRunning);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const insertPatternIntoWorldAction = useGameStore((state) => state.insertPatternIntoWorld);
  const addCustomPattern = useGameStore((state) => state.addCustomPattern);
  const deleteCustomPattern = useGameStore((state) => state.deleteCustomPattern);

  return useMemo(
    () => ({
      source: "local" as const,
      world,
      customPatterns,
      population: world ? getPopulation(world.grid) : 0,
      speed,
      isRunning,
      isLoading: false,
      errorMessage: null,
      setRunning,
      setSpeed,
      updateGrid(updater) {
        if (worldId) {
          updateGridWith(worldId, updater);
        }
      },
      stepWorld() {
        if (worldId) {
          stepWorldAction(worldId);
        }
      },
      randomizeWorld() {
        if (worldId) {
          randomizeWorldAction(worldId);
        }
      },
      clearWorld() {
        if (worldId) {
          clearWorldAction(worldId);
        }
      },
      insertPatternIntoWorld(patternId, anchorX, anchorY) {
        if (worldId) {
          insertPatternIntoWorldAction(worldId, patternId, anchorX, anchorY);
        }
      },
      addCustomPattern,
      deleteCustomPattern,
      forceSave() {},
    }),
    [
      addCustomPattern,
      clearWorldAction,
      customPatterns,
      deleteCustomPattern,
      insertPatternIntoWorldAction,
      isRunning,
      randomizeWorldAction,
      setRunning,
      setSpeed,
      speed,
      stepWorldAction,
      updateGridWith,
      world,
      worldId,
    ],
  );
}

export function GameScreen({ source }: GameScreenProps) {
  const { worldId } = useParams();
  const localSession = useLocalGameSession(source === "local" ? worldId : undefined);
  const cloudSession = useCloudGameSession(worldId, source === "cloud");
  const session = source === "cloud" ? cloudSession : localSession;
  const world = session.world;
  const gameCanvasRef = useRef<GameCanvasHandle | null>(null);
  const stepWorldRef = useRef(session.stepWorld);
  const setRunningRef = useRef(session.setRunning);
  const forceSaveRef = useRef(session.forceSave);
  const [activePatternId, setActivePatternId] = useState<string | null>(null);
  const [isPatternCaptureMode, setIsPatternCaptureMode] = useState(false);
  const [pendingPatternSelection, setPendingPatternSelection] = useState<ReturnType<
    typeof createPatternFromSelection
  > | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const patterns = [...BUILTIN_PATTERNS, ...session.customPatterns];
  const customPatternIds = new Set(session.customPatterns.map((pattern) => pattern.id));

  useEffect(() => {
    stepWorldRef.current = session.stepWorld;
    setRunningRef.current = session.setRunning;
    forceSaveRef.current = session.forceSave;
  }, [session.forceSave, session.setRunning, session.stepWorld]);

  useEffect(() => {
    if (!world || !session.isRunning) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      stepWorldRef.current();
    }, Math.max(50, 900 / session.speed));

    return () => window.clearInterval(interval);
  }, [session.isRunning, session.speed, worldId, Boolean(world)]);

  useEffect(
    () => () => {
      setRunningRef.current(false);
      forceSaveRef.current();
    },
    [],
  );

  if (source === "cloud" && session.isLoading) {
    return (
      <main className="page-fade flex h-[var(--app-stable-vh)] items-center justify-center px-6">
        <div className="panel ghost-border rounded-[28px] px-8 py-8 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Cloud Mode</p>
          <p className="font-display mt-4 text-3xl text-white">Loading world...</p>
        </div>
      </main>
    );
  }

  if (!worldId || !world) {
    return <Navigate to={`/worlds?mode=${source}`} replace />;
  }

  const activeWorld = world;
  const errorMessage = actionError ?? session.errorMessage;

  function handleSelectionComplete(selection: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }) {
    const created = createPatternFromSelection(activeWorld.grid, selection, "__pending__", "__pending__");
    setIsPatternCaptureMode(false);

    if (created) {
      setPendingPatternSelection(created);
    }
  }

  async function handleSavePattern(values: { name: string; description: string }) {
    if (!pendingPatternSelection) {
      return;
    }

    setActionError(null);

    try {
      await session.addCustomPattern({
        ...pendingPatternSelection,
        name: values.name,
        description: values.description,
      });
      setPendingPatternSelection(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save pattern.");
    }
  }

  return (
    <main className="page-fade h-[var(--app-stable-vh)] overflow-hidden px-2 py-2 sm:px-3 sm:py-3 xl:px-4 xl:py-4">
      <PatternSaveModal
        isOpen={pendingPatternSelection !== null}
        patternPreview={pendingPatternSelection}
        onClose={() => setPendingPatternSelection(null)}
        onSave={handleSavePattern}
      />

      <div className="flex h-full min-h-0 flex-col rounded-[24px] bg-black/18 px-2 py-2 xl:rounded-[28px] xl:px-3 xl:py-3">
        <header className="panel ghost-border flex items-center justify-between gap-3 rounded-[20px] px-3 py-3 sm:px-4 xl:px-5">
          <ResponsiveIconButton
            to={`/worlds?mode=${source}`}
            icon={<ArrowLeft size={18} />}
            mobileLabel="Exit"
            desktopLabel="Save and Exit"
            className="!min-w-0 !gap-0.5 !px-0.5 !py-1 sm:px-1.5 sm:py-1"
          />

          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              {source === "cloud" ? "Cloud World" : "Local World"}
            </p>
            <h1 className="font-display mt-1 truncate text-lg text-white sm:text-xl xl:text-2xl">{world.name}</h1>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Generation</p>
            <p className="font-display mt-1 text-xl text-white sm:text-2xl">{activeWorld.generation}</p>
          </div>
        </header>

        {errorMessage ? (
          <p className="mt-2 rounded-[18px] border border-red-400/22 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-2 grid min-h-0 flex-1 gap-2 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="panel ghost-border flex min-h-0 flex-col rounded-[24px] p-2 sm:p-3">
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MetricCard label="Population" value={String(session.population)} />
              <MetricCard label="Occupancy" value={`${(((session.population / (activeWorld.width * activeWorld.height || 1)) * 100)).toFixed(1)}%`} />
              <MetricCard label="Grid" value={`${activeWorld.width}x${activeWorld.height}`} />
              <MetricCard label="Mode" value={source === "cloud" ? "Cloud" : "Local"} />
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.1),transparent_35%),rgba(13,13,13,0.9)] p-2">
              <GameCanvas
                ref={(instance) => {
                  gameCanvasRef.current = instance;
                }}
                grid={activeWorld.grid}
                activePatternId={activePatternId}
                patterns={session.customPatterns}
                isSelectionMode={isPatternCaptureMode}
                onToggleCell={(x, y) =>
                  session.updateGrid((currentGrid) =>
                    setCell(currentGrid, x, y, currentGrid[y][x] === 1 ? 0 : 1),
                  )
                }
                onPaintCell={(x, y, value) =>
                  session.updateGrid((currentGrid) =>
                    currentGrid[y]?.[x] === value ? currentGrid : setCell(currentGrid, x, y, value),
                  )
                }
                onDropPattern={(patternId, x, y) => {
                  session.insertPatternIntoWorld(patternId, x, y);
                  setActivePatternId(null);
                }}
                onSelectionComplete={handleSelectionComplete}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[repeat(7,minmax(0,1fr))]">
              <ActionButton icon={<StepForward size={16} />} label="Step" onClick={() => session.stepWorld()} />
              <ActionButton
                icon={session.isRunning ? <Pause size={16} /> : <Play size={16} />}
                label={session.isRunning ? "Pause" : "Play"}
                accent={!session.isRunning}
                onClick={() => session.setRunning(!session.isRunning)}
              />
              <ActionButton icon={<Shuffle size={16} />} label="Randomize" onClick={() => session.randomizeWorld()} />
              <ActionButton icon={<Trash2 size={16} />} label="Clear" onClick={() => session.clearWorld()} />
              <ActionButton icon={<LocateFixed size={16} />} label="Center" onClick={() => gameCanvasRef.current?.centerBoard()} />
              <ActionButton
                icon={isPatternCaptureMode ? <X size={16} /> : <Plus size={16} />}
                label={isPatternCaptureMode ? "Cancel Capture" : "Capture Pattern"}
                onClick={() => {
                  setActivePatternId(null);
                  setIsPatternCaptureMode((value) => !value);
                }}
              />
              <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    <Gauge size={14} />
                    Speed
                  </span>
                  <span className="font-display text-lg text-white">{session.speed}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={session.speed}
                  onChange={(event) => session.setSpeed(Number(event.target.value))}
                  className="mt-3 h-1 w-full accent-cyan-300"
                />
              </div>
            </div>
          </div>

          <aside className="panel ghost-border flex min-h-0 flex-col rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Patterns</p>
                <p className="mt-1 text-sm text-slate-400">
                  Select a shape, then click the board to place it.
                </p>
              </div>
              {activePatternId ? (
                <button
                  className="rounded-full border border-red-400/22 bg-red-500/10 p-2 text-red-100 transition hover:bg-red-500/18"
                  onClick={() => setActivePatternId(null)}
                  aria-label="Cancel active pattern"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {patterns.map((pattern) => {
                const isActive = activePatternId === pattern.id;
                const isCustomPattern = customPatternIds.has(pattern.id);

                return (
                  <div
                    key={pattern.id}
                    className={`rounded-[18px] border p-3 transition ${
                      isActive
                        ? "border-cyan-300/28 bg-cyan-300/[0.08]"
                        : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <button className="w-full text-left" onClick={() => setActivePatternId(pattern.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg text-white">{pattern.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
                            {pattern.width}x{pattern.height}
                          </p>
                        </div>
                        {isCustomPattern ? (
                          <button
                            className="rounded-full bg-red-500/80 p-1.5 text-white transition hover:bg-red-500/90"
                            onClick={(event) => {
                              event.stopPropagation();
                              Promise.resolve(session.deleteCustomPattern(pattern.id)).catch((error) => {
                                setActionError(
                                  error instanceof Error ? error.message : "Unable to delete pattern.",
                                );
                              });
                            }}
                            aria-label={`Delete ${pattern.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-3 rounded-[14px] bg-[#0d0d0d] p-3">
                        <PatternPreview pattern={pattern} />
                      </div>
                      {pattern.description ? (
                        <p className="mt-3 text-sm leading-6 text-slate-400">{pattern.description}</p>
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="font-display mt-2 text-xl text-white">{value}</p>
    </div>
  );
}

function ActionButton({
  accent = false,
  icon,
  label,
  onClick,
}: {
  accent?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="control-button justify-center py-3" data-accent={accent ? "true" : undefined} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function PatternPreview({
  pattern,
}: {
  pattern: { id: string; width: number; height: number; cells: Array<[number, number]> };
}) {
  const columns = Math.max(pattern.width + 2, 1);
  const rows = Math.max(pattern.height + 2, 1);
  const cellSize = Math.max(2, Math.min(10, Math.floor(Math.min(110 / columns, 70 / rows))));
  const liveCells = new Set(pattern.cells.map(([x, y]) => `${x + 1}-${y + 1}`));

  return (
    <div
      className="mx-auto grid justify-center gap-[2px]"
      style={{
        gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
      }}
    >
      {Array.from({ length: columns * rows }, (_, index) => {
        const x = index % columns;
        const y = Math.floor(index / columns);
        const isLive = liveCells.has(`${x}-${y}`);

        return (
          <span
            key={`${pattern.id}-${x}-${y}`}
            className={
              isLive
                ? "rounded-[2px] bg-white shadow-[0_0_8px_rgba(0,240,255,0.24)]"
                : "rounded-[2px] bg-[#1a1a1a]"
            }
          />
        );
      })}
    </div>
  );
}
