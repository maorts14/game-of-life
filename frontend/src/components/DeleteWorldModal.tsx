interface DeleteWorldModalProps {
  isOpen: boolean;
  worldName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteWorldModal({
  isOpen,
  worldName,
  onClose,
  onConfirm,
}: DeleteWorldModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel ghost-border w-full max-w-lg rounded-[28px] px-8 py-8"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-[0.35em] text-red-200/70">Delete World</p>
        <h2 className="font-display mt-3 text-4xl text-white">Are you sure?</h2>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          <span className="text-white">{worldName}</span> will be removed. This
          action can&apos;t be undone.
        </p>

        <div className="mt-10 flex justify-end gap-4">
          <button type="button" className="control-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="control-button border-red-400/24 bg-red-500/12 text-red-100 hover:border-red-400/34 hover:bg-red-500/18 hover:text-white"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
