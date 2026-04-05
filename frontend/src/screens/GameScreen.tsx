import { useEffect, useState } from "react";
import { ArrowLeft, Info, Minus, Pause, Play, Plus, Shuffle, StepForward, Trash2 } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { BUILTIN_PATTERNS, createPatternFromSelection } from "../features/game/presets";
import { GameCanvas } from "../components/GameCanvas";
import { PatternSaveModal } from "../components/PatternSaveModal";
import { paintCell, useGameStore, usePatterns, usePopulation, useSelectedWorld } from "../store/gameStore";

export function GameScreen() {
  const { worldId } = useParams();
  const world = useSelectedWorld(worldId);
  const customPatterns = usePatterns();
  const population = usePopulation(worldId);
  const [isPatternPickerOpen, setIsPatternPickerOpen] = useState(false);
  const [hoveredInfoPatternId, setHoveredInfoPatternId] = useState<string | null>(null);
  const [activePatternId, setActivePatternId] = useState<string | null>(null);
  const [isPatternCaptureMode, setIsPatternCaptureMode] = useState(false);
  const [pendingPatternCellCount, setPendingPatternCellCount] = useState(0);
  const [pendingPatternSelection, setPendingPatternSelection] = useState<ReturnType<
    typeof createPatternFromSelection
  > | null>(null);
  const isRunning = useGameStore((state) => state.isRunning);
  const speed = useGameStore((state) => state.speed);
  const updateGrid = useGameStore((state) => state.updateGrid);
  const stepWorld = useGameStore((state) => state.stepWorld);
  const randomizeWorld = useGameStore((state) => state.randomizeWorld);
  const clearWorld = useGameStore((state) => state.clearWorld);
  const setRunning = useGameStore((state) => state.setRunning);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const insertPatternIntoWorld = useGameStore((state) => state.insertPatternIntoWorld);
  const addCustomPattern = useGameStore((state) => state.addCustomPattern);
  const deleteCustomPattern = useGameStore((state) => state.deleteCustomPattern);

  const patterns = [...BUILTIN_PATTERNS, ...customPatterns];
  const customPatternIds = new Set(customPatterns.map((pattern) => pattern.id));

  useEffect(() => {
    if (!worldId || !isRunning) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      stepWorld(worldId);
    }, Math.max(50, 900 / speed));

    return () => window.clearInterval(interval);
  }, [isRunning, speed, stepWorld, worldId]);

  useEffect(() => () => setRunning(false), [setRunning]);

  if (!worldId || !world) {
    return <Navigate to="/worlds" replace />;
  }

  const density = ((population / (world.width * world.height || 1)) * 100).toFixed(1);

  function handleSelectionComplete(selection: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }) {
    if (!world) {
      return;
    }

    const minX = Math.min(selection.startX, selection.endX);
    const maxX = Math.max(selection.startX, selection.endX);
    const minY = Math.min(selection.startY, selection.endY);
    const maxY = Math.max(selection.startY, selection.endY);
    let liveCount = 0;

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        liveCount += world.grid[y]?.[x] ?? 0;
      }
    }

    const created = createPatternFromSelection(world.grid, selection, "__pending__", "__pending__");
    setIsPatternCaptureMode(false);

    if (!created) {
      return;
    }

    setPendingPatternCellCount(liveCount);
    setPendingPatternSelection(created);
  }

  return (
    <main className="page-fade h-screen overflow-hidden px-2 py-2 sm:px-3 sm:py-3 xl:px-4 xl:py-4">
      <PatternSaveModal
        isOpen={pendingPatternSelection !== null}
        patternPreview={pendingPatternSelection}
        onClose={() => {
          setPendingPatternSelection(null);
          setPendingPatternCellCount(0);
        }}
        onSave={({ name, description }) => {
          if (!pendingPatternSelection) {
            return;
          }

          addCustomPattern({
            ...pendingPatternSelection,
            name,
            description,
          });
          setPendingPatternSelection(null);
          setPendingPatternCellCount(0);
          setIsPatternPickerOpen(true);
        }}
      />
      <div className="flex h-full flex-col rounded-[24px] bg-black/18 px-2 py-2 xl:rounded-[28px] xl:px-3 xl:py-3">
        <header className="panel ghost-border grid grid-cols-1 gap-3 rounded-[18px] px-3 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:rounded-[22px] sm:px-4 xl:px-5 xl:py-3">
          <Link to="/" className="control-button w-full justify-center sm:w-auto">
            <ArrowLeft size={18} />
            Save and Exit
          </Link>

          <div className="text-center sm:text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">World Identifier</p>
            <h1 className="font-display mt-1 text-xl text-white xl:text-2xl">{world.name}</h1>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Generation</p>
            <p className="font-display mt-1 text-2xl text-white xl:text-3xl">{world.generation}</p>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 py-3 xl:grid-cols-[180px_minmax(0,1fr)_220px]">
          <aside className="panel ghost-border rounded-[20px] px-4 py-3 xl:hidden">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Telemetry</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="font-display text-xl text-white">{population}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">Population</p>
              </div>
              <div>
                <p className="font-display text-xl text-white">{density}%</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">Occupancy</p>
              </div>
              <div>
                <p className="font-display text-xl text-white">
                  {world.width}x{world.height}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">Grid</p>
              </div>
            </div>
          </aside>

          <aside className="panel ghost-border hidden min-h-0 rounded-[24px] p-5 xl:block">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Telemetry</p>
            <div className="mt-6 space-y-6">
              <div>
                <p className="font-display text-3xl text-white">{population}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">Population</p>
              </div>
              <div>
                <p className="font-display text-3xl text-white">{density}%</p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">Occupancy</p>
              </div>
              <div>
                <p className="font-display text-3xl text-white">
                  {world.width}x{world.height}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">Grid</p>
              </div>
            </div>
          </aside>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.1),transparent_35%),rgba(13,13,13,0.9)] px-2 pb-2 pt-0 xl:rounded-[26px] xl:px-3 xl:pb-3">
            <div className="min-h-0 w-full flex-1">
              <GameCanvas
                grid={world.grid}
                activePatternId={activePatternId}
                patterns={customPatterns}
                isSelectionMode={isPatternCaptureMode}
                onToggleCell={(x, y) =>
                  updateGrid(worldId, paintCell(world.grid, x, y, world.grid[y][x] === 1 ? 0 : 1))
                }
                onPaintCell={(x, y, value) => {
                  if (world.grid[y]?.[x] !== value) {
                    updateGrid(worldId, paintCell(world.grid, x, y, value));
                  }
                }}
                onDropPattern={(patternId, x, y) => {
                  insertPatternIntoWorld(worldId, patternId, x, y);
                  setActivePatternId(null);
                }}
                onSelectionComplete={handleSelectionComplete}
              />
            </div>
            <div className="flex h-11 items-center justify-center pt-6">
              {activePatternId ? (
                <button
                  className="flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 shadow-[0_0_18px_rgba(220,38,38,0.12)] transition hover:bg-red-500/18 hover:text-white"
                  onClick={() => setActivePatternId(null)}
                >
                  <Trash2 size={16} />
                  Cancel
                </button>
              ) : null}
            </div>
          </div>

          <aside className="panel ghost-border min-h-0 rounded-[20px] p-4 xl:hidden">
            <div className="flex flex-wrap gap-2">
              <button className="control-button grow justify-center py-2.5" onClick={() => stepWorld(worldId)}>
                <StepForward size={16} />
                Step
              </button>
              {isRunning ? (
                <button className="control-button grow justify-center py-2.5" onClick={() => setRunning(false)}>
                  <Pause size={16} />
                  Pause
                </button>
              ) : (
                <button
                  className="control-button grow justify-center py-2.5"
                  data-accent="true"
                  onClick={() => setRunning(true)}
                >
                  <Play size={16} />
                  Play
                </button>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button className="control-button grow justify-center py-2.5" onClick={() => randomizeWorld(worldId)}>
                <Shuffle size={16} />
                Randomize
              </button>
              <button className="control-button grow justify-center py-2.5" onClick={() => clearWorld(worldId)}>
                <Trash2 size={16} />
                Clear
              </button>
            </div>

            <button
              className="control-button mt-2 w-full justify-center py-2.5"
              onClick={() => setIsPatternPickerOpen((value) => !value)}
            >
              {isPatternPickerOpen ? <Minus size={16} /> : <Plus size={16} />}
              Patterns
            </button>

            {isPatternPickerOpen ? (
              <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
                <button
                  className="w-full rounded-[16px] border border-dashed border-cyan-300/24 bg-white/[0.03] px-3 py-3 text-left transition hover:border-cyan-300/40 hover:bg-white/[0.05]"
                  onClick={() => {
                    setActivePatternId(null);
                    setIsPatternCaptureMode(true);
                  }}
                >
                  <span className="font-display text-base text-white">New Pattern</span>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Select a range on the board.</p>
                </button>
                {patterns.map((pattern) => (
                  <button
                    key={`mobile-${pattern.id}`}
                    className="w-full rounded-[14px] bg-white/[0.03] px-3 py-2 text-left transition hover:bg-white/[0.06]"
                    onClick={() => setActivePatternId(pattern.id)}
                  >
                    <span className="font-display text-sm text-white">{pattern.name}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.35em] text-slate-500">Speed</span>
                <span className="w-10 text-right font-display text-xl text-white">{speed}</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                className="mt-3 h-1.5 w-full accent-cyan-300"
              />
            </div>
          </aside>

          <aside className="panel ghost-border hidden min-h-0 overflow-y-auto rounded-[24px] p-5 xl:flex xl:flex-col">
            <div className="sticky top-[-20px] z-20 -mx-5 bg-[#1c1b1b] px-5 pb-0 pt-4 shadow-[0_5px_20px_rgba(28,27,27,0.7)]">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Field Actions</p>
              <button
                className="control-button mt-6 w-full justify-center py-3"
                onClick={() => setIsPatternPickerOpen((value) => !value)}
              >
                {isPatternPickerOpen ? <Minus size={18} /> : <Plus size={18} />}
                Patterns
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {isPatternPickerOpen ? (
                <button
                  className="rounded-[18px] border border-dashed border-cyan-300/24 bg-white/[0.03] px-4 py-4 text-left transition hover:border-cyan-300/40 hover:bg-white/[0.05]"
                  onClick={() => {
                    setActivePatternId(null);
                    setIsPatternCaptureMode(true);
                  }}
                >
                  <span className="font-display text-base text-white">New Pattern</span>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Select a range on the board.
                  </p>
                </button>
              ) : null}
              {isPatternPickerOpen
                ? patterns.map((pattern) => {
                    const hasDescription = pattern.description.trim().length > 0;
                    const isInfoOpen = hoveredInfoPatternId === pattern.id;
                    const isCustomPattern = customPatternIds.has(pattern.id);

                    return (
                      <div key={pattern.id} className="rounded-[18px] bg-white/[0.03] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <button
                            className="min-w-0 flex-1 text-left"
                            onClick={() => {
                              setActivePatternId(pattern.id);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-display text-base text-white">{pattern.name}</span>
                            </div>
                          </button>
                          <div className="flex items-center gap-1">
                            {hasDescription ? (
                              <button
                                className="rounded-full p-1 text-slate-400 transition hover:bg-white/8 hover:text-white"
                                onMouseEnter={() => setHoveredInfoPatternId(pattern.id)}
                                onMouseLeave={() =>
                                  setHoveredInfoPatternId((value) => (value === pattern.id ? null : value))
                                }
                                aria-label={`About ${pattern.name}`}
                              >
                                <Info size={16} />
                              </button>
                            ) : null}
                            {isCustomPattern ? (
                              <button
                                className="rounded-full bg-red-500/80 p-1.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_0_1px_rgba(185,28,28,0.7),0_0_12px_rgba(220,38,38,0.24)] transition hover:bg-red-500/90 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_0_1px_rgba(185,28,28,0.78),0_0_14px_rgba(220,38,38,0.28)]"
                                onClick={() => {
                                  if (activePatternId === pattern.id) {
                                    setActivePatternId(null);
                                  }
                                  deleteCustomPattern(pattern.id);
                                }}
                                aria-label={`Delete ${pattern.name}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <button
                          className="mt-3 block w-full overflow-hidden rounded-[14px] bg-[#0d0d0d] p-3 transition hover:bg-[#141414]"
                          onClick={() => setActivePatternId(pattern.id)}
                        >
                          <PatternPreview pattern={pattern} />
                        </button>
                        {hasDescription && isInfoOpen ? (
                          <p className="mt-3 text-xs leading-5 text-slate-400">{pattern.description}</p>
                        ) : null}
                      </div>
                    );
                  })
                : null}
              <button className="control-button justify-center py-3" onClick={() => randomizeWorld(worldId)}>
                <Shuffle size={18} />
                Randomize
              </button>
              <button className="control-button justify-center py-3" onClick={() => clearWorld(worldId)}>
                <Trash2 size={18} />
                Clear
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col pt-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Simulation</p>
              <div className="mt-4 flex flex-col gap-3">
                <button className="control-button justify-center py-3" onClick={() => stepWorld(worldId)}>
                  <StepForward size={18} />
                  Step
                </button>

                {isRunning ? (
                  <button className="control-button justify-center py-3" onClick={() => setRunning(false)}>
                    <Pause size={18} />
                    Pause
                  </button>
                ) : (
                  <button
                    className="control-button justify-center py-3"
                    data-accent="true"
                    onClick={() => setRunning(true)}
                  >
                    <Play size={18} />
                    Play
                  </button>
                )}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-500">Speed</span>
                  <span className="w-10 text-right font-display text-xl text-white">{speed}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={speed}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                  className="mt-4 h-1 w-full accent-cyan-300"
                />
              </div>

              <div className="mt-auto pt-6">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                Wheel to zoom. Right-click or middle-drag to pan.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PatternPreview({
  pattern,
}: {
  pattern: { id: string; width: number; height: number; cells: Array<[number, number]> };
}) {
  const maxPreviewWidth = 124;
  const maxPreviewHeight = 72;
  const previewOptions = [1, 0]
    .flatMap((padding) =>
      [2, 1, 0.5, 0].map((cellGap) => {
        const columns = Math.max(pattern.width + padding * 2, 1);
        const rows = Math.max(pattern.height + padding * 2, 1);
        const cellSize = Math.max(
          0.5,
          Math.min(
            8,
            Math.min(
              (maxPreviewWidth - (columns - 1) * cellGap) / columns,
              (maxPreviewHeight - (rows - 1) * cellGap) / rows,
            ),
          ),
        );

        return { padding, columns, rows, cellSize, cellGap };
      }),
    )
    .sort((left, right) => {
      if (right.cellSize !== left.cellSize) {
        return right.cellSize - left.cellSize;
      }

      if (right.cellGap !== left.cellGap) {
        return right.cellGap - left.cellGap;
      }

      return right.padding - left.padding;
    });
  const { padding, columns, rows, cellSize, cellGap } = previewOptions[0];
  const liveCells = new Set(pattern.cells.map(([x, y]) => `${x + padding}-${y + padding}`));

  return (
    <div
      className="mx-auto grid justify-center gap-[2px]"
      style={{
        gap: `${cellGap}px`,
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
            className={isLive ? "rounded-[2px] bg-white shadow-[0_0_8px_rgba(0,240,255,0.24)]" : "rounded-[2px] bg-[#1a1a1a]"}
          />
        );
      })}
    </div>
  );
}
