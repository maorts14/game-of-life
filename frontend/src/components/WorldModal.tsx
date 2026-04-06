import { FormEvent, useState } from "react";
import { clamp } from "../utils/formatters";

interface WorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: { name: string; width: number; height: number }) => void;
}

export function WorldModal({ isOpen, onClose, onCreate }: WorldModalProps) {
  const [name, setName] = useState("");
  const [width, setWidth] = useState(48);
  const [height, setHeight] = useState(32);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate({
      name,
      width: clamp(width, 12, 120),
      height: clamp(height, 12, 80),
    });
    setName("");
    setWidth(48);
    setHeight(32);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="panel ghost-border w-full max-w-xl rounded-[28px] px-8 py-8"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-cyan-200/70">
          New Simulation
        </p>
        <h2 className="font-display text-4xl text-white">Build a new world</h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
          Define the arena, name the experiment, and initialize a fresh cellular field.
        </p>

        <div className="mt-8 space-y-6">
          <label className="block">
            <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-400">
              World Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full border-b border-cyan-300/40 bg-transparent px-0 py-3 text-lg text-white outline-none placeholder:text-slate-600"
              placeholder="Void Core"
            />
          </label>

          <div className="grid grid-cols-2 gap-6">
            <label className="block">
              <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-400">
                Width
              </span>
              <input
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                type="number"
                min={12}
                max={120}
                className="w-full border-b border-cyan-300/40 bg-transparent px-0 py-3 text-lg text-white outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-400">
                Height
              </span>
              <input
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
                type="number"
                min={12}
                max={80}
                className="w-full border-b border-cyan-300/40 bg-transparent px-0 py-3 text-lg text-white outline-none"
              />
            </label>
          </div>
        </div>

        <div className="mt-10 flex justify-end gap-4">
          <button type="button" className="control-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="control-button" data-accent="true">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
