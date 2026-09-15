interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
      <div className="animate-fade-in absolute inset-0 bg-ink/45" onClick={onCancel} />
      <div className="animate-rise-in relative w-full max-w-xs rounded-3xl bg-white p-5 shadow-card">
        <p className="mb-1.5 text-[15px] font-bold text-ink">{title}</p>
        {description && (
          <p className="mb-5 text-[13px] leading-relaxed text-ink-faint">{description}</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-line bg-white py-3 text-[13.5px] font-bold text-ink-muted"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-2xl py-3 text-[13.5px] font-bold text-white ${
              danger ? "bg-rose-500" : "bg-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
