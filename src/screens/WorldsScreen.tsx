import { useState } from "react";
import { Plus, ArrowRight, ArrowLeft, Layers3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BackgroundLifeCanvas } from "../components/BackgroundLifeCanvas";
import { WorldModal } from "../components/WorldModal";
import { useGameStore, useWorldSummaries } from "../store/gameStore";
import { formatDate } from "../utils/formatters";

export function WorldsScreen() {
  const worlds = useWorldSummaries();
  const createWorld = useGameStore((state) => state.createWorld);
  const selectWorld = useGameStore((state) => state.selectWorld);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  function handleCreateWorld(params: { name: string; width: number; height: number }) {
    const worldId = createWorld(params);
    setIsModalOpen(false);
    navigate(`/game/${worldId}`);
  }

  function handleOpenWorld(worldId: string) {
    selectWorld(worldId);
    navigate(`/game/${worldId}`);
  }

  return (
    <main className="page-fade relative min-h-screen overflow-hidden px-8 py-10 xl:px-16">
      <BackgroundLifeCanvas
        className="absolute inset-0 h-full w-full opacity-55"
        cellSize={20}
        density={0.09}
        tickMs={220}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.82)_0%,rgba(6,6,6,0.7)_40%,rgba(6,6,6,0.88)_100%)]" />
      <WorldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateWorld}
      />

      <div className="absolute left-8 top-8 z-10 xl:left-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 backdrop-blur-md transition hover:border-cyan-300/25 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mt-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">World Registry</p>
            <h1 className="font-display mt-4 text-5xl text-white">Choose a world</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Re-enter a saved experiment or initialize a new grid. Each world preserves its last
              observed state in local storage.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="control-button shrink-0"
            data-accent="true"
          >
            <Plus size={18} />
            Create New World
          </button>
        </div>

        <div className="panel ghost-border mt-12 overflow-hidden rounded-[32px]">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-8 py-5 text-xs uppercase tracking-[0.35em] text-slate-500">
            <span>World</span>
            <span>Grid Size</span>
            <span>Last Modified</span>
            <span className="text-right">Launch</span>
          </div>

          {worlds.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-8 text-center">
              <Layers3 size={40} className="text-cyan-200/70" />
              <h2 className="font-display mt-6 text-3xl text-white">No worlds online yet</h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">
                Create your first simulation space to begin editing cells, running generations, and
                preserving patterns locally.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {worlds.map((world) => (
                <button
                  key={world.id}
                  onClick={() => handleOpenWorld(world.id)}
                  className="grid w-full grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 px-8 py-7 text-left transition hover:bg-white/3"
                >
                  <div>
                    <p className="font-display text-2xl text-white">{world.name}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                      Gen {world.generation}
                    </p>
                  </div>
                  <p className="text-sm text-slate-300">
                    {world.width} x {world.height}
                  </p>
                  <p className="text-sm text-slate-400">{formatDate(world.updatedAt)}</p>
                  <span className="inline-flex justify-end text-cyan-200">
                    <ArrowRight size={20} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
