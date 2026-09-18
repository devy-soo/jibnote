import { useState } from "react";

interface DeleteAccountDialogProps {
  open: boolean;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

export function DeleteAccountDialog({ open, onConfirm, onCancel }: DeleteAccountDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function close() {
    setPassword("");
    setError("");
    setSubmitting(false);
    onCancel();
  }

  async function handleConfirm() {
    if (!password) {
      setError("비밀번호를 입력해 주세요");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원 탈퇴에 실패했어요");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
      <div className="animate-fade-in absolute inset-0 bg-ink/45" onClick={close} />
      <div className="animate-rise-in relative w-full max-w-xs rounded-3xl bg-white p-5 shadow-card">
        <p className="mb-1.5 text-[15px] font-bold text-ink">정말 탈퇴할까요?</p>
        <p className="mb-4 text-[13px] leading-relaxed text-ink-faint">
          저장한 매물, 사진, 메모가 모두 삭제되고 되돌릴 수 없어요. 계속하려면 비밀번호를 입력해 주세요.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="비밀번호"
          className="mb-1.5 w-full rounded-2xl border border-line bg-white px-3.5 py-3 text-[13.5px] font-medium text-ink outline-none focus:border-primary"
        />
        {error && <p className="mb-2 text-[12px] font-semibold text-rose-500">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            className="flex-1 rounded-2xl border border-line bg-white py-3 text-[13.5px] font-bold text-ink-muted disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 rounded-2xl bg-rose-500 py-3 text-[13.5px] font-bold text-white disabled:opacity-60"
          >
            {submitting ? "처리 중..." : "탈퇴하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
