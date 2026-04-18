import { FormEvent, useState } from "react";
import {
  DEFAULT_WORLD_HEIGHT,
  DEFAULT_WORLD_WIDTH,
  MAX_WORLD_HEIGHT,
  MAX_WORLD_WIDTH,
  MIN_WORLD_HEIGHT,
  MIN_WORLD_WIDTH,
} from "@game-of-life/shared-game";
import { clamp } from "../utils/formatters";

interface WorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: { name: string; width: number; height: number }) => void;
}

export function WorldModal({ isOpen, onClose, onCreate }: WorldModalProps) {
  const [name, setName] = useState("");
  const [width, setWidth] = useState(DEFAULT_WORLD_WIDTH);
  const [height, setHeight] = useState(DEFAULT_WORLD_HEIGHT);

  if (!isOpen) {
    return null;
  }

  function resetForm() {
    setName("");
    setWidth(DEFAULT_WORLD_WIDTH);
    setHeight(DEFAULT_WORLD_HEIGHT);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleCreate() {
    onCreate({
      name,
      width: clamp(
        Number.isFinite(width) ? width : DEFAULT_WORLD_WIDTH,
        MIN_WORLD_WIDTH,
        MAX_WORLD_WIDTH,
      ),
      height: clamp(
        Number.isFinite(height) ? height : DEFAULT_WORLD_HEIGHT,
        MIN_WORLD_HEIGHT,
        MAX_WORLD_HEIGHT,
      ),
    });
    resetForm();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleCreate();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={handleClose}
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
                min={MIN_WORLD_WIDTH}
                max={MAX_WORLD_WIDTH}
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
                min={MIN_WORLD_HEIGHT}
                max={MAX_WORLD_HEIGHT}
                className="w-full border-b border-cyan-300/40 bg-transparent px-0 py-3 text-lg text-white outline-none"
              />
            </label>
          </div>
        </div>

        <div className="mt-10 flex justify-end gap-4">
          <button type="button" className="control-button" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="control-button"
            data-accent="true"
            onClick={handleCreate}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
