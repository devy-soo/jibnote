import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "../../components/PageShell";
import { useAuthStore } from "../../store/useAuthStore";

export function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 서로 달라요.");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <div className="flex min-h-screen flex-col justify-center px-6 py-10">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white">
            <svg width="26" height="26" viewBox="0 0 64 64">
              <path d="M32 14 12 30v20a2 2 0 0 0 2 2h12V38h12v14h12a2 2 0 0 0 2-2V30L32 14z" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-[20px] font-bold text-ink">회원가입</h1>
          <p className="text-[13px] font-medium text-ink-faint">
            PC와 휴대폰에서 같은 계정으로 로그인하면 매물이 동기화돼요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-[14px] font-medium text-ink outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 (6자 이상)"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-[14px] font-medium text-ink outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 확인"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-[14px] font-medium text-ink outline-none focus:border-primary"
          />
          {error && <p className="text-[12.5px] font-semibold text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-2xl bg-primary py-4 text-[14.5px] font-bold text-white shadow-cta disabled:opacity-60"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] font-medium text-ink-faint">
          이미 계정이 있나요?{" "}
          <Link to="/login" className="font-bold text-primary">
            로그인
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
