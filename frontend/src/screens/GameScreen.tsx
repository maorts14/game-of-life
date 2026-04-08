import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Gauge,
  Info,
  Minus,
  Pause,
  Play,
  Plus,
  Shapes,
  Shuffle,
  StepForward,
  Trash2,
  Wrench,
} from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { BUILTIN_PATTERNS, createPatternFromSelection } from "../features/game/presets";
import { GameCanvas } from "../components/GameCanvas";
import type { GameCanvasHandle } from "../components/GameCanvas";
import { PatternSaveModal } from "../components/PatternSaveModal";
import { ResponsiveIconButton } from "../components/ResponsiveIconButton";
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
  const [mobileControlPanel, setMobileControlPanel] = useState<"speed" | "actions" | "patterns" | null>(null);
  const [pendingPatternCellCount, setPendingPatternCellCount] = useState(0);
  const [pendingPatternSelection, setPendingPatternSelection] = useState<ReturnType<
    typeof createPatternFromSelection
  > | null>(null);
  const gameCanvasRef = useRef<GameCanvasHandle | null>(null);
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

  useEffect(() => {
    if (!activePatternId) {
      return undefined;
    }

    function handleDesktopPatternPlacement(event: PointerEvent) {
      if (event.pointerType === "touch" || event.button !== 0) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (
        target.closest(
          "button, a, input, textarea, select, label, [role='button'], [data-skip-pattern-drop='true']",
        )
      ) {
        return;
      }

      gameCanvasRef.current?.dropPatternAtClientPoint(event.clientX, event.clientY);
      setActivePatternId(null);
    }

    document.addEventListener("pointerdown", handleDesktopPatternPlacement);

    return () => {
      document.removeEventListener("pointerdown", handleDesktopPatternPlacement);
    };
  }, [activePatternId]);

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
    <main className="page-fade h-[100dvh] overflow-hidden px-2 py-2 sm:min-h-screen sm:px-3 sm:py-3 xl:h-screen xl:px-4 xl:py-4">
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
      <div className="flex h-full min-h-0 flex-col rounded-[24px] bg-black/18 px-2 py-1 sm:min-h-[calc(100vh-1.5rem)] sm:py-2 xl:h-full xl:min-h-0 xl:rounded-[28px] xl:px-3 xl:py-3">
        <header className="panel ghost-border grid grid-cols-[46px_minmax(0,1fr)] items-stretch gap-2.5 rounded-[20px] px-3 py-2 sm:hidden">
          <ResponsiveIconButton
            to="/"
            icon={<ArrowLeft size={18} />}
            mobileLabel="Exit"
            desktopLabel="Save and Exit"
            className="!min-w-0 !self-stretch !justify-center !gap-0.5 !rounded-[12px] !px-0.5 !py-0.5"
          />

          <div className="flex min-w-0 flex-col justify-center gap-1 px-0.5">
            <h1 className="font-display truncate text-[1.18rem] leading-none text-white">
              {world.name}
            </h1>

            <div className="flex items-end gap-2">
              <p className="truncate text-[0.85rem] leading-none uppercase tracking-[0.3em] text-slate-500">
                Generation
              </p>
              <p className="font-display text-[1.05rem] leading-none text-white">
                {world.generation}
              </p>
            </div>
          </div>
        </header>

        <header className="panel ghost-border hidden items-center justify-between gap-3 rounded-[20px] px-3 py-3 sm:flex sm:px-4 xl:rounded-[22px] xl:px-5 xl:py-3">
          <ResponsiveIconButton
            to="/"
            icon={<ArrowLeft size={18} />}
            mobileLabel="Exit"
            desktopLabel="Save and Exit"
            className="!min-w-0 !gap-0.5 !px-0.5 !py-1 sm:px-1.5 sm:py-1"
          />

          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">World Name</p>
            <h1 className="font-display mt-1 truncate text-lg text-white sm:text-xl xl:text-2xl">{world.name}</h1>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Generation</p>
            <p className="font-display mt-1 text-xl text-white sm:text-2xl xl:text-3xl">{world.generation}</p>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-1 pt-1 pb-0.5 xl:grid-cols-[180px_minmax(0,1fr)_220px] xl:gap-3 xl:py-3">
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

          <div className="relative flex min-h-0 flex-col overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.1),transparent_35%),rgba(13,13,13,0.9)] px-2 pb-2 pt-2 xl:overflow-visible xl:rounded-[26px] xl:px-3 xl:pb-3 xl:pt-0">
            <div className="panel ghost-border mb-2.5 grid grid-cols-3 gap-1 rounded-[16px] px-2 py-1.5 xl:mb-2 xl:hidden">
              <div className="px-0.5 py-0.5 text-center">
                <p className="font-display text-base leading-none text-white">{population}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-slate-500">Population</p>
              </div>
              <div className="px-0.5 py-0.5 text-center">
                <p className="font-display text-base leading-none text-white">{density}%</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-slate-500">Occupancy</p>
              </div>
              <div className="px-0.5 py-0.5 text-center">
                <p className="font-display text-base leading-none text-white">
                  {world.width}x{world.height}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-slate-500">Grid</p>
              </div>
            </div>
            <div
              className={`min-h-0 w-full flex-1 transition-[margin] duration-200 ${
                activePatternId ? "xl:mb-[25px]" : ""
              }`}
            >
              <GameCanvas
                ref={(instance) => {
                  gameCanvasRef.current = instance;
                }}
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
            {activePatternId ? (
              <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 hidden -translate-x-1/2 translate-y-1/2 xl:flex">
                <button
                  className="pointer-events-auto flex h-10 items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 text-sm text-red-100 shadow-[0_0_18px_rgba(220,38,38,0.12)] transition hover:bg-red-500/18 hover:text-white"
                  onClick={() => setActivePatternId(null)}
                >
                  <Trash2 size={16} />
                  Cancel
                </button>
              </div>
            ) : null}
            <div className="relative mt-2.5 xl:hidden">
              {activePatternId ? (
                <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2">
                  <button
                    className="pointer-events-auto flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3.5 py-1.5 text-[13px] text-red-100 shadow-[0_0_18px_rgba(220,38,38,0.12)] transition hover:bg-red-500/18 hover:text-white"
                    onClick={() => setActivePatternId(null)}
                  >
                    <Trash2 size={16} />
                    Cancel
                  </button>
                </div>
              ) : null}

              <div
                className={`transition-transform duration-200 ease-out ${
                  activePatternId ? "translate-y-11" : "translate-y-0"
                }`}
              >
                {mobileControlPanel ? (
                  <div
                    className={`panel ghost-border mb-2 rounded-[16px] ${
                      mobileControlPanel === "actions" ? "px-[2px] py-[2px]" : "px-2 py-2"
                    }`}
                  >
                    {mobileControlPanel === "speed" ? (
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Speed</span>
                          <span className="font-display text-base text-white">{speed}</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={speed}
                          onChange={(event) => setSpeed(Number(event.target.value))}
                          className="mt-2 h-1 w-full accent-cyan-300"
                        />
                      </div>
                    ) : null}

                    {mobileControlPanel === "actions" ? (
                      <div className="overflow-x-auto px-1 pt-1 pb-1">
                        <div className="flex min-w-max justify-center gap-2">
                          <ResponsiveIconButton
                            icon={<Shuffle size={16} />}
                            mobileLabel="Randomize"
                            onClick={() => randomizeWorld(worldId)}
                            className="!min-w-[82px] !px-2 !py-1.5"
                          />
                          <ResponsiveIconButton
                            icon={<Trash2 size={16} />}
                            mobileLabel="Clear"
                            onClick={() => clearWorld(worldId)}
                            className="!min-w-[70px] !px-2 !py-1.5"
                          />
                        </div>
                      </div>
                    ) : null}

                    {mobileControlPanel === "patterns" ? (
                      <div className="flex items-start gap-2.5 overflow-x-auto pb-0.5">
                        <button
                          className="mt-[2.5px] inline-flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-[16px] border border-dashed border-cyan-300/24 bg-cyan-300/[0.06] text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.1]"
                          onClick={() => {
                            setActivePatternId(null);
                            setIsPatternCaptureMode(true);
                          }}
                          aria-label="Create pattern"
                        >
                          <Plus size={20} />
                        </button>
                          {patterns.map((pattern) => (
                            <button
                              key={`mobile-${pattern.id}`}
                              className={`flex w-[84px] shrink-0 flex-col items-center justify-start text-center transition ${
                                activePatternId === pattern.id
                                  ? "text-cyan-100"
                                  : "text-white"
                              }`}
                              onClick={() => setActivePatternId(pattern.id)}
                            >
                              <span
                              className={`flex h-[50px] w-[84px] items-center justify-center overflow-hidden rounded-[15px] transition ${
                                activePatternId === pattern.id
                                  ? "bg-cyan-300/18 shadow-[0_0_0_1px_rgba(103,232,249,0.28)]"
                                  : "bg-white/[0.03] hover:bg-white/[0.08]"
                              }`}
                            >
                              <PatternPreview pattern={pattern} size="compact" />
                            </span>
                            <span className="mt-1 block w-full truncate px-1 text-[13px] leading-3">
                              {pattern.name}
                            </span>
                            <span className="mt-0.5 block w-full truncate px-1 text-[12px] leading-3 text-slate-500">
                              {pattern.width}x{pattern.height}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="panel ghost-border rounded-[18px] px-2 py-1.5">
                  <div className="mb-1.5 flex items-center justify-center gap-2">
                    <ResponsiveIconButton
                      icon={<StepForward size={16} />}
                      mobileLabel="Step"
                      onClick={() => stepWorld(worldId)}
                      className="min-w-[60px]"
                    />

                    {isRunning ? (
                      <ResponsiveIconButton
                        icon={<Pause size={16} />}
                        mobileLabel="Pause"
                        onClick={() => setRunning(false)}
                        className="min-w-[60px]"
                      />
                    ) : (
                      <ResponsiveIconButton
                        icon={<Play size={16} />}
                        mobileLabel="Play"
                        onClick={() => setRunning(true)}
                        accent
                        className="min-w-[60px]"
                      />
                    )}
                  </div>

                  <div className="flex justify-center gap-1.5 overflow-x-auto pb-0.5">
                    <ResponsiveIconButton
                      icon={<Gauge size={16} />}
                      mobileLabel="Speed"
                      active={mobileControlPanel === "speed"}
                      onClick={() =>
                        setMobileControlPanel((value) => (value === "speed" ? null : "speed"))
                      }
                    />

                    <ResponsiveIconButton
                      icon={<Wrench size={16} />}
                      mobileLabel="Actions"
                      active={mobileControlPanel === "actions"}
                      onClick={() =>
                        setMobileControlPanel((value) => (value === "actions" ? null : "actions"))
                      }
                    />

                    <ResponsiveIconButton
                      icon={<Shapes size={16} />}
                      mobileLabel="Patterns"
                      active={mobileControlPanel === "patterns"}
                      onClick={() =>
                        setMobileControlPanel((value) => (value === "patterns" ? null : "patterns"))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-cyan-300/24 bg-cyan-300/[0.06] px-4 py-3 text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.1]"
                  onClick={() => {
                    setActivePatternId(null);
                    setIsPatternCaptureMode(true);
                  }}
                >
                  <Plus size={16} />
                  <span className="font-display text-base">Create</span>
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
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display text-base text-white">{pattern.name}</span>
                              </div>
                              <span className="mt-0.5 block text-[13px] text-slate-500">
                                {pattern.width}x{pattern.height}
                              </span>
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
                          className="mt-1.5 block w-full overflow-hidden rounded-[14px] bg-[#0d0d0d] p-3 transition hover:bg-[#141414]"
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
  size = "default",
}: {
  pattern: { id: string; width: number; height: number; cells: Array<[number, number]> };
  size?: "default" | "compact";
}) {
  const maxPreviewWidth = size === "compact" ? 56 : 124;
  const maxPreviewHeight = size === "compact" ? 26 : 72;
  const previewOptions = (size === "compact" ? [1] : [1, 0])
    .flatMap((padding) =>
      (size === "compact" ? [1, 0.5, 0] : [2, 1, 0.5, 0]).map((cellGap) => {
        const columns = Math.max(pattern.width + padding * 2, 1);
        const rows = Math.max(pattern.height + padding * 2, 1);
        const cellSize = Math.max(
          size === "compact" ? 0.75 : 0.5,
          Math.min(
            size === "compact" ? 5 : 8,
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
      className="mx-auto grid justify-center"
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
