import { useEffect } from "react";
import { ArrowLeft, Pause, Play, Shuffle, Sparkles, StepForward, Trash2 } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { GameCanvas } from "../components/GameCanvas";
import { paintCell, useGameStore, usePopulation, useSelectedWorld } from "../store/gameStore";

export function GameScreen() {
  const { worldId } = useParams();
  const world = useSelectedWorld(worldId);
  const population = usePopulation(worldId);
  const isRunning = useGameStore((state) => state.isRunning);
  const speed = useGameStore((state) => state.speed);
  const updateGrid = useGameStore((state) => state.updateGrid);
  const stepWorld = useGameStore((state) => state.stepWorld);
  const randomizeWorld = useGameStore((state) => state.randomizeWorld);
  const clearWorld = useGameStore((state) => state.clearWorld);
  const setRunning = useGameStore((state) => state.setRunning);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const seedWorldGlider = useGameStore((state) => state.seedWorldGlider);

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
    <main className="page-fade min-h-screen px-6 py-6 xl:px-8">
      <div className="flex min-h-[calc(100vh-3rem)] flex-col rounded-[32px] bg-black/18 px-4 py-4 xl:px-6 xl:py-5">
        <header className="panel ghost-border flex items-center justify-between rounded-[24px] px-5 py-4">
          <Link to="/worlds" className="control-button">
            <ArrowLeft size={18} />
            Save and Exit
          </Link>

          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">World Identifier</p>
            <h1 className="font-display mt-2 text-2xl text-white">{world.name}</h1>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Generation</p>
            <p className="font-display mt-2 text-3xl text-white">{world.generation}</p>
          </div>
        </header>

        <section className="grid flex-1 grid-cols-1 gap-6 py-6 xl:grid-cols-[220px_minmax(0,1fr)_220px]">
          <aside className="panel ghost-border hidden rounded-[28px] p-6 xl:block">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Telemetry</p>
            <div className="mt-8 space-y-8">
              <div>
                <p className="font-display text-4xl text-white">{population}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">Population</p>
              </div>
              <div>
                <p className="font-display text-4xl text-white">{density}%</p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">Occupancy</p>
              </div>
              <div>
                <p className="font-display text-4xl text-white">
                  {world.width}x{world.height}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">Grid</p>
              </div>
            </div>
          </aside>

          <div className="flex items-center justify-center overflow-auto rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.1),transparent_35%),rgba(13,13,13,0.9)] p-4">
            <GameCanvas
              grid={world.grid}
              onToggleCell={(x, y) =>
                updateGrid(worldId, paintCell(world.grid, x, y, world.grid[y][x] === 1 ? 0 : 1))
              }
              onPaintCell={(x, y, value) => {
                if (world.grid[y]?.[x] !== value) {
                  updateGrid(worldId, paintCell(world.grid, x, y, value));
                }
              }}
            />
          </div>

          <aside className="panel ghost-border hidden rounded-[28px] p-6 xl:block">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Field Actions</p>
            <div className="mt-8 flex flex-col gap-3">
              <button className="control-button justify-center" onClick={() => seedWorldGlider(worldId)}>
                <Sparkles size={18} />
                Seed Glider
              </button>
              <button className="control-button justify-center" onClick={() => randomizeWorld(worldId)}>
                <Shuffle size={18} />
                Randomize
              </button>
              <button className="control-button justify-center" onClick={() => clearWorld(worldId)}>
                <Trash2 size={18} />
                Clear
              </button>
            </div>
          </aside>
        </section>

        <footer className="panel ghost-border flex flex-wrap items-center justify-between gap-4 rounded-[24px] px-5 py-4">
          <div className="flex flex-wrap gap-3">
            <button className="control-button" onClick={() => stepWorld(worldId)}>
              <StepForward size={18} />
              Step
            </button>

            {isRunning ? (
              <button className="control-button" onClick={() => setRunning(false)}>
                <Pause size={18} />
                Pause
              </button>
            ) : (
              <button className="control-button" data-accent="true" onClick={() => setRunning(true)}>
                <Play size={18} />
                Play
              </button>
            )}

            <button className="control-button" onClick={() => randomizeWorld(worldId)}>
              <Shuffle size={18} />
              Randomize
            </button>

            <button className="control-button" onClick={() => clearWorld(worldId)}>
              <Trash2 size={18} />
              Clear
            </button>
          </div>

          <div className="flex min-w-72 items-center gap-4">
            <span className="text-xs uppercase tracking-[0.35em] text-slate-500">Speed</span>
            <input
              type="range"
              min={1}
              max={20}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="h-1 w-full accent-cyan-300"
            />
            <span className="w-10 text-right font-display text-xl text-white">{speed}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
