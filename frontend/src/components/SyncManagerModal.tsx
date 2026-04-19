import { useState } from "react";
import type { LocalPattern, LocalWorld } from "../features/game/types";
import { StorageBadge } from "./StorageBadge";

interface SyncManagerModalProps {
  isOpen: boolean;
  worlds: LocalWorld[];
  patterns: LocalPattern[];
  onClose: () => void;
  onSyncWorld: (worldId: string) => Promise<void>;
  onSyncPattern: (patternId: string) => Promise<void>;
}

export function SyncManagerModal({
  isOpen,
  worlds,
  patterns,
  onClose,
  onSyncWorld,
  onSyncPattern,
}: SyncManagerModalProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleSyncWorld(worldId: string) {
    setPendingId(worldId);
    setErrorMessage(null);

    try {
      await onSyncWorld(worldId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "World sync failed.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleSyncPattern(patternId: string) {
    setPendingId(patternId);
    setErrorMessage(null);

    try {
      await onSyncPattern(patternId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Pattern sync failed.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel ghost-border w-full max-w-3xl rounded-[28px] px-8 py-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Sync Manager</p>
            <h2 className="font-display mt-3 text-4xl text-white">Review local data</h2>
          </div>
          <StorageBadge storageMode="local" />
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Local items stay on this device. Sync each item you want to copy into your cloud account.
        </p>

        {errorMessage ? <p className="mt-5 text-sm text-red-200">{errorMessage}</p> : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[22px] bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Worlds</p>
            <div className="mt-4 space-y-3">
              {worlds.length === 0 ? <p className="text-sm text-slate-500">No unsynced local worlds.</p> : null}
              {worlds.map((world) => (
                <div
                  key={world.id}
                  className="flex items-center justify-between gap-4 rounded-[16px] bg-black/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-display truncate text-lg text-white">{world.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                      {world.width}x{world.height} • Gen {world.generation}
                    </p>
                  </div>
                  <button
                    className="control-button !px-4 !py-2 text-sm"
                    onClick={() => void handleSyncWorld(world.id)}
                    disabled={pendingId === world.id}
                  >
                    {pendingId === world.id ? "Syncing..." : "Sync"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Patterns</p>
            <div className="mt-4 space-y-3">
              {patterns.length === 0 ? <p className="text-sm text-slate-500">No unsynced local patterns.</p> : null}
              {patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="flex items-center justify-between gap-4 rounded-[16px] bg-black/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-display truncate text-lg text-white">{pattern.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                      {pattern.width}x{pattern.height}
                    </p>
                  </div>
                  <button
                    className="control-button !px-4 !py-2 text-sm"
                    onClick={() => void handleSyncPattern(pattern.id)}
                    disabled={pendingId === pattern.id}
                  >
                    {pendingId === pattern.id ? "Syncing..." : "Sync"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-10 flex justify-end">
          <button type="button" className="control-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
