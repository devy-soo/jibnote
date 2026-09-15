import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "../../components/PageShell";
import { useAuthStore } from "../../store/useAuthStore";

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했어요.");
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
          <h1 className="text-[20px] font-bold text-ink">집로그</h1>
          <p className="text-[13px] font-medium text-ink-faint">
            어느 기기에서 열어도 저장한 매물이 그대로 보여요
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
            placeholder="비밀번호"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-[14px] font-medium text-ink outline-none focus:border-primary"
          />
          {error && <p className="text-[12.5px] font-semibold text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-2xl bg-primary py-4 text-[14.5px] font-bold text-white shadow-cta disabled:opacity-60"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] font-medium text-ink-faint">
          아직 계정이 없나요?{" "}
          <Link to="/signup" className="font-bold text-primary">
            회원가입
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
