import { useState, type KeyboardEvent } from "react";
import { Plus, ArrowLeft, Layers3, Grid2x2, History, Trash2, Cloud, HardDrive } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BackgroundLifeCanvas } from "../components/BackgroundLifeCanvas";
import { DeleteWorldModal } from "../components/DeleteWorldModal";
import { ResponsiveIconButton } from "../components/ResponsiveIconButton";
import { WorldModal } from "../components/WorldModal";
import { useCloudWorlds } from "../hooks/useCloudWorlds";
import { useAuth } from "../providers/AuthProvider";
import { useGameStore, useWorldSummaries } from "../store/gameStore";
import type { WorldSummary } from "../features/game/types";
import { formatCompactDate, formatDate } from "../utils/formatters";

type WorldMode = "local" | "cloud";

function getModeFromSearchParam(rawMode: string | null): WorldMode {
  return rawMode === "cloud" ? "cloud" : "local";
}

export function WorldsScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = getModeFromSearchParam(searchParams.get("mode"));
  const isCloudMode = mode === "cloud";
  const localWorlds = useWorldSummaries();
  const cloudWorlds = useCloudWorlds(isCloudMode && auth.status === "authenticated");
  const createWorld = useGameStore((state) => state.createWorld);
  const deleteLocalWorld = useGameStore((state) => state.deleteWorld);
  const selectWorld = useGameStore((state) => state.selectWorld);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [worldPendingDelete, setWorldPendingDelete] = useState<WorldSummary | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const worlds = isCloudMode ? cloudWorlds.worlds : localWorlds;
  const canCreateCloudWorld = auth.status === "authenticated";

  function setMode(nextMode: WorldMode) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("mode", nextMode);
      return next;
    });
  }

  async function handleCreateWorld(params: { name: string; width: number; height: number }) {
    setActionError(null);

    try {
      if (isCloudMode) {
        const world = await cloudWorlds.createWorld(params);
        setIsModalOpen(false);
        navigate(`/game/cloud/${world.id}`);
        return;
      }

      const worldId = createWorld(params);
      setIsModalOpen(false);
      navigate(`/game/local/${worldId}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to create world.");
    }
  }

  function handleOpenWorld(worldId: string) {
    if (isCloudMode) {
      navigate(`/game/cloud/${worldId}`);
      return;
    }

    selectWorld(worldId);
    navigate(`/game/local/${worldId}`);
  }

  function handleDeleteRequest(world: WorldSummary) {
    setWorldPendingDelete(world);
  }

  async function handleConfirmDeleteWorld() {
    if (!worldPendingDelete) {
      return;
    }

    setActionError(null);

    try {
      if (isCloudMode) {
        await cloudWorlds.deleteWorld(worldPendingDelete.id);
      } else {
        deleteLocalWorld(worldPendingDelete.id);
      }

      setWorldPendingDelete(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete world.");
    }
  }

  function handleWorldRowKeyDown(event: KeyboardEvent<HTMLDivElement>, worldId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenWorld(worldId);
    }
  }

  return (
    <main className="page-fade relative h-[var(--app-stable-vh)] overflow-hidden px-4 py-6 sm:px-6 sm:py-8 xl:px-16 xl:py-10">
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
      <DeleteWorldModal
        isOpen={worldPendingDelete !== null}
        worldName={worldPendingDelete?.name ?? ""}
        onClose={() => setWorldPendingDelete(null)}
        onConfirm={handleConfirmDeleteWorld}
      />

      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6 xl:left-16 xl:top-8">
        <ResponsiveIconButton
          to="/"
          icon={<ArrowLeft size={16} />}
          mobileLabel="Back"
          desktopLabel="Back"
          className="!min-w-0 !gap-0.5 backdrop-blur-md !px-0.5 !py-1"
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full min-h-0 max-w-7xl flex-col">
        <div className="mt-14 flex flex-col gap-4 sm:mt-20 sm:gap-6 xl:mt-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">
              {isCloudMode ? "Cloud Vault" : "Local Vault"}
            </p>
            <h1 className="font-display mt-2 text-4xl text-white sm:mt-3 sm:text-5xl">
              {isCloudMode ? "Choose a synced world" : "Choose a local world"}
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-400">
              {isCloudMode
                ? "Cloud worlds are tied to your account. They autosave in the background while your local vault stays untouched."
                : "Local worlds stay in this browser. Use Cloud mode separately when you want a synced library of worlds and patterns."}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            {auth.status === "authenticated" ? (
              <>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300">
                  {auth.user?.email ?? "Signed in"}
                </div>
                <button className="control-button justify-center" onClick={() => void auth.logout()}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <ResponsiveIconButton
                  to="/login"
                  icon={<Cloud size={16} />}
                  mobileLabel="Login"
                  desktopLabel="Sign In"
                  className="!min-w-[112px]"
                />
                <ResponsiveIconButton
                  to="/signup"
                  icon={<Plus size={16} />}
                  mobileLabel="Signup"
                  desktopLabel="Create Account"
                  accent
                  className="!min-w-[148px]"
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={`control-button ${!isCloudMode ? "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100" : ""}`}
            onClick={() => setMode("local")}
          >
            <HardDrive size={18} />
            Local
          </button>
          <button
            className={`control-button ${isCloudMode ? "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100" : ""}`}
            onClick={() => setMode("cloud")}
          >
            <Cloud size={18} />
            Cloud
          </button>
        </div>

        {actionError ? (
          <p className="mt-4 rounded-[18px] border border-red-400/22 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {actionError}
          </p>
        ) : null}

        {isCloudMode && auth.status !== "authenticated" ? (
          <div className="panel ghost-border mt-4 flex min-h-80 flex-1 flex-col items-center justify-center rounded-[24px] px-8 text-center sm:mt-[25px] sm:rounded-[32px]">
            <Cloud size={40} className="text-cyan-200/70" />
            <h2 className="font-display mt-6 text-3xl text-white">Sign in to enter Cloud mode</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">
              Local worlds remain available without an account. Sign in or create one to keep a
              separate synced library of worlds, patterns, and playback preferences.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ResponsiveIconButton
                to="/login"
                icon={<Cloud size={18} />}
                mobileLabel="Sign In"
                desktopLabel="Sign In"
              />
              <ResponsiveIconButton
                to="/signup"
                icon={<Plus size={18} />}
                mobileLabel="Create"
                desktopLabel="Create Account"
                accent
              />
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex justify-end">
              <ResponsiveIconButton
                icon={<Plus size={18} />}
                mobileLabel="Create"
                desktopLabel={isCloudMode ? "Create Cloud World" : "Create Local World"}
                onClick={() => setIsModalOpen(true)}
                accent
                className="hidden min-w-[176px] px-3 py-1 md:flex md:w-fit md:shrink-0"
              />
            </div>

            {isCloudMode && cloudWorlds.isLoading ? (
              <div className="panel ghost-border mt-3 flex min-h-80 flex-1 items-center justify-center rounded-[24px] px-8 text-center sm:mt-[25px] sm:rounded-[32px]">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Loading cloud worlds...</p>
              </div>
            ) : worlds.length === 0 ? (
              <div className="panel ghost-border mt-3 flex min-h-80 flex-1 flex-col items-center justify-center rounded-[24px] px-8 text-center sm:mt-[25px] sm:rounded-[32px]">
                <Layers3 size={40} className="text-cyan-200/70" />
                <h2 className="font-display mt-6 text-3xl text-white">
                  {isCloudMode ? "No cloud worlds online yet" : "No local worlds online yet"}
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">
                  {isCloudMode
                    ? "Create your first synced simulation space to keep grids and custom patterns attached to your account."
                    : "Create your first device-only simulation space to begin editing cells, running generations, and preserving patterns locally."}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 md:hidden">
                  <div className="space-y-3 pb-1">
                    {worlds.map((world) => (
                      <div
                        key={world.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenWorld(world.id)}
                        onKeyDown={(event) => handleWorldRowKeyDown(event, world.id)}
                        className="group relative w-full overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,rgba(28,27,27,0.78),rgba(18,18,18,0.68))] px-4 py-4 text-left backdrop-blur-xl transition duration-200 active:scale-[0.985]"
                      >
                        <span className="absolute bottom-4 left-0 top-4 w-[2px] rounded-full bg-cyan-300/0 transition duration-200 group-hover:bg-cyan-300/70 group-active:bg-cyan-300/70" />

                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-display truncate text-[1.2rem] font-semibold tracking-[0.01em] text-white">
                              {world.name}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400">
                              <span className="inline-flex items-center gap-1.5">
                                <Grid2x2 size={12} className="text-slate-500" />
                                {world.width} x {world.height}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <History size={12} className="text-slate-500" />
                                Gen {world.generation}
                              </span>
                            </div>
                          </div>

                          <div className="mt-0.5 flex shrink-0 flex-col items-end gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-400/12 bg-red-500/8 text-red-100 transition hover:border-red-400/22 hover:bg-red-500/14 hover:text-white"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteRequest(world);
                              }}
                              aria-label={`Delete ${world.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                            <span className="text-[11px] text-slate-400">
                              {formatCompactDate(world.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel ghost-border mt-3 hidden min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] sm:mt-[25px] sm:rounded-[32px] md:flex">
                  <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-8 py-5 text-xs uppercase tracking-[0.35em] text-slate-500">
                    <span>World</span>
                    <span>Grid Size</span>
                    <span>Last Modified</span>
                    <span className="text-right">Delete</span>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="divide-y divide-white/4">
                      {worlds.map((world) => (
                        <div
                          key={world.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleOpenWorld(world.id)}
                          onKeyDown={(event) => handleWorldRowKeyDown(event, world.id)}
                          className="group grid w-full grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 px-8 py-7 text-left transition hover:bg-white/3"
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
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-400/12 bg-red-500/8 text-red-100 transition hover:border-red-400/22 hover:bg-red-500/14 hover:text-white"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteRequest(world);
                              }}
                              aria-label={`Delete ${world.name}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="mt-4 flex justify-center md:hidden">
              <ResponsiveIconButton
                icon={<Plus size={18} />}
                mobileLabel="Create"
                desktopLabel={isCloudMode ? "Create Cloud World" : "Create Local World"}
                onClick={() => setIsModalOpen(true)}
                accent
                className="w-full max-w-[280px] px-3 py-1"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
