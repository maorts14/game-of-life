import { useEffect, useState } from "react";
import { ArrowLeft, Info, Minus, Pause, Play, Plus, Shuffle, StepForward, Trash2 } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PATTERNS } from "../features/game/presets";
import { GameCanvas } from "../components/GameCanvas";
import { paintCell, useGameStore, usePopulation, useSelectedWorld } from "../store/gameStore";

export function GameScreen() {
  const { worldId } = useParams();
  const world = useSelectedWorld(worldId);
  const population = usePopulation(worldId);
  const [isPatternPickerOpen, setIsPatternPickerOpen] = useState(false);
  const [hoveredInfoPatternId, setHoveredInfoPatternId] = useState<string | null>(null);
  const [activePatternId, setActivePatternId] = useState<string | null>(null);
  const isRunning = useGameStore((state) => state.isRunning);
  const speed = useGameStore((state) => state.speed);
  const updateGrid = useGameStore((state) => state.updateGrid);
  const stepWorld = useGameStore((state) => state.stepWorld);
  const randomizeWorld = useGameStore((state) => state.randomizeWorld);
  const clearWorld = useGameStore((state) => state.clearWorld);
  const setRunning = useGameStore((state) => state.setRunning);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const insertPatternIntoWorld = useGameStore((state) => state.insertPatternIntoWorld);

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

  return (
    <main className="page-fade h-screen overflow-hidden px-3 py-3 xl:px-4 xl:py-4">
      <div className="flex h-full flex-col rounded-[28px] bg-black/18 px-2 py-2 xl:px-3 xl:py-3">
        <header className="panel ghost-border flex items-center justify-between rounded-[22px] px-4 py-3 xl:px-5 xl:py-3">
          <Link to="/" className="control-button">
            <ArrowLeft size={18} />
            Save and Exit
          </Link>

          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">World Identifier</p>
            <h1 className="font-display mt-1 text-xl text-white xl:text-2xl">{world.name}</h1>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Generation</p>
            <p className="font-display mt-1 text-2xl text-white xl:text-3xl">{world.generation}</p>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 py-3 xl:grid-cols-[180px_minmax(0,1fr)_220px]">
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

          <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.1),transparent_35%),rgba(13,13,13,0.9)] p-2 xl:p-3">
            <GameCanvas
              grid={world.grid}
              activePatternId={activePatternId}
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
            />
          </div>

          <aside className="panel ghost-border hidden min-h-0 overflow-y-auto rounded-[24px] p-5 xl:flex xl:flex-col">
            <div className="sticky top-[-20px] z-20 -mx-5 border-b border-white/6 bg-[#1c1b1b] px-5 pb-3 pt-4 shadow-[0_18px_32px_rgba(28,27,27,0.96)]">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Field Actions</p>
              <button
                className="control-button mt-6 w-full justify-center py-3"
                onClick={() => setIsPatternPickerOpen((value) => !value)}
              >
                {isPatternPickerOpen ? <Minus size={18} /> : <Plus size={18} />}
                Insert Pattern
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {isPatternPickerOpen
                ? PATTERNS.map((pattern) => {
                    const isInfoOpen = hoveredInfoPatternId === pattern.id;

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
                        </div>
                        <button
                          className="mt-3 block w-full rounded-[14px] bg-[#0d0d0d] p-3 transition hover:bg-[#141414]"
                          onClick={() => setActivePatternId(pattern.id)}
                        >
                          <PatternPreview patternId={pattern.id} />
                        </button>
                        {isInfoOpen ? (
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

            <div className="pt-6">
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

              <p className="mt-5 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                Click a pattern, then click the board to place it from the top-left cell.
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                Wheel to zoom. Right-click or middle-drag to pan.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PatternPreview({ patternId }: { patternId: string }) {
  const pattern = PATTERNS.find((entry) => entry.id === patternId);

  if (!pattern) {
    return null;
  }

  const columns = Math.max(pattern.width + 2, 6);
  const rows = Math.max(pattern.height + 2, 6);
  const liveCells = new Set(pattern.cells.map(([x, y]) => `${x + 1}-${y + 1}`));

  return (
    <div
      className="mx-auto grid aspect-[2.1/1] max-w-[148px] gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
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
