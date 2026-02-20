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
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary bg-rose-700 hover:bg-rose-800" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

