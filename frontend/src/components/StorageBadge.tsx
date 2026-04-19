import type { StorageMode } from "../features/game/types";

export function StorageBadge({
  storageMode,
  compact = false,
}: {
  storageMode: StorageMode;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] ${
        storageMode === "cloud"
          ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
          : "border-amber-300/30 bg-amber-300/10 text-amber-100"
      } ${compact ? "px-2 py-0.5 text-[9px]" : ""}`}
    >
      {storageMode === "cloud" ? "Cloud" : "Local"}
    </span>
  );
}
