import { FormEvent, useState } from "react";
import type { PatternDefinition } from "../features/game/presets";

interface PatternSaveModalProps {
  isOpen: boolean;
  patternPreview: PatternDefinition | null;
  onClose: () => void;
  onSave: (values: { name: string; description: string }) => void;
}

export function PatternSaveModal({
  isOpen,
  patternPreview,
  onClose,
  onSave,
}: PatternSaveModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ name, description });
    setName("");
    setDescription("");
  }

  function handleClose() {
    setName("");
    setDescription("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="panel ghost-border w-full max-w-lg rounded-[28px] px-8 py-8"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">New Pattern</p>
        <h2 className="font-display mt-3 text-4xl text-white">Save captured selection</h2>

        <div className="mt-8 space-y-6">
          <label className="block">
            <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-400">
              Pattern Name
            </span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full border-b border-cyan-300/40 bg-transparent px-0 py-3 text-lg text-white outline-none"
              placeholder="My oscillator"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-400">
              Description Optional
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none"
              placeholder="Describe what this pattern does."
            />
          </label>

          {patternPreview ? (
            <div className="block">
              <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-400">
                Trimmed Preview
              </span>
              <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-4">
                <PatternPreview pattern={patternPreview} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button type="button" className="control-button" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="control-button" data-accent="true">
            Save Pattern
          </button>
        </div>
      </form>
    </div>
  );
}

function PatternPreview({ pattern }: { pattern: PatternDefinition }) {
  const columns = Math.max(pattern.width + 2, 6);
  const rows = Math.max(pattern.height + 2, 6);
  const liveCells = new Set(pattern.cells.map(([x, y]) => `${x + 1}-${y + 1}`));
  const cellSize = 10;

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
