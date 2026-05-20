"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/70">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="dashboardButton dashboardButtonOutline" onClick={onCancel}>Cancel</button>
          <button className="dashboardButton dashboardButtonPrimary bg-rose-700 hover:bg-rose-800" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

type CanvasConfirmDialogsProps = {
  confirmDeleteNodeId: string | null;
  setConfirmDeleteNodeId: (value: string | null) => void;
  handleDeleteNode: (id: string) => Promise<void>;
  confirmDeleteElementId: string | null;
  setConfirmDeleteElementId: (value: string | null) => void;
  handleDeleteElement: (id: string) => Promise<void>;
  confirmDeleteOutlineItemId: string | null;
  setConfirmDeleteOutlineItemId: (value: string | null) => void;
  handleDeleteOutlineItem: () => Promise<void>;
};

export function CanvasConfirmDialogs({
  confirmDeleteNodeId,
  setConfirmDeleteNodeId,
  handleDeleteNode,
  confirmDeleteElementId,
  setConfirmDeleteElementId,
  handleDeleteElement,
  confirmDeleteOutlineItemId,
  setConfirmDeleteOutlineItemId,
  handleDeleteOutlineItem,
}: CanvasConfirmDialogsProps) {
  return (
    <>
      <ConfirmDialog
        open={!!confirmDeleteNodeId}
        title="Delete document?"
        message="This will permanently remove the document from the map."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteNodeId(null)}
        onConfirm={() => {
          const id = confirmDeleteNodeId;
          setConfirmDeleteNodeId(null);
          if (!id) return;
          void handleDeleteNode(id);
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteElementId}
        title="Delete component?"
        message="This will permanently remove the selected component from the map."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteElementId(null)}
        onConfirm={() => {
          const id = confirmDeleteElementId;
          setConfirmDeleteElementId(null);
          if (!id) return;
          void handleDeleteElement(id);
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteOutlineItemId}
        title="Delete outline item?"
        message="This removes the selected heading/content and any dependent children defined by your data rules."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteOutlineItemId(null)}
        onConfirm={() => void handleDeleteOutlineItem()}
      />
    </>
  );
}
