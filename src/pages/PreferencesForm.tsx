import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { useToast } from "../components/ToastProvider";
import { usePreferencesStore } from "../store/usePreferencesStore";
import { OPTION_ITEMS } from "../constants/platforms";

export function PreferencesForm() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const preferences = usePreferencesStore((s) => s.preferences);
  const save = usePreferencesStore((s) => s.save);

  const [maxDeposit, setMaxDeposit] = useState("");
  const [maxMonthlyRent, setMaxMonthlyRent] = useState("");
  const [minAreaSqm, setMinAreaSqm] = useState("");
  const [minRooms, setMinRooms] = useState("");
  const [desiredStation, setDesiredStation] = useState("");
  const [requiredOptions, setRequiredOptions] = useState<string[]>([]);
  const [requireParking, setRequireParking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    setMaxDeposit(preferences.maxDeposit != null ? String(preferences.maxDeposit) : "");
    setMaxMonthlyRent(preferences.maxMonthlyRent != null ? String(preferences.maxMonthlyRent) : "");
    setMinAreaSqm(preferences.minAreaSqm != null ? String(preferences.minAreaSqm) : "");
    setMinRooms(preferences.minRooms != null ? String(preferences.minRooms) : "");
    setDesiredStation(preferences.desiredStation ?? "");
    setRequiredOptions(preferences.requiredOptions ?? []);
    setRequireParking(preferences.requireParking ?? false);
    setHydrated(true);
  }, [preferences, hydrated]);

  function toggleOption(item: string) {
    setRequiredOptions((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  }

  function resetAll() {
    setMaxDeposit("");
    setMaxMonthlyRent("");
    setMinAreaSqm("");
    setMinRooms("");
    setDesiredStation("");
    setRequiredOptions([]);
    setRequireParking(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await save({
        maxDeposit: maxDeposit ? Number(maxDeposit) : undefined,
        maxMonthlyRent: maxMonthlyRent ? Number(maxMonthlyRent) : undefined,
        minAreaSqm: minAreaSqm ? Number(minAreaSqm) : undefined,
        minRooms: minRooms ? Number(minRooms) : undefined,
        desiredStation: desiredStation.trim() || undefined,
        requiredOptions,
        requireParking: requireParking || undefined,
      });
      showToast("내 조건을 저장했어요");
      navigate(-1);
    } catch {
      showToast("저장에 실패했어요. 다시 시도해 주세요");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <form onSubmit={handleSubmit} className="pb-28">
        <div className="flex items-center gap-3 px-5 pb-2 pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white shadow-sm"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0D1B34" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
          </button>
          <h1 className="text-[17px] font-bold text-ink">내 조건 설정</h1>
        </div>

        <div className="px-5 pt-2">
          <p className="mb-5 text-[12.5px] leading-relaxed text-ink-light">
            여기서 설정한 조건들과 매물 정보가 얼마나 맞는지, 매물 목록과 상세 화면에 매칭 점수로 보여드려요.
            채워둔 항목만 비교하니까, 필요한 것만 입력하면 돼요.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-5">
          <div className="grid grid-cols-2 gap-3">
            <Section label="보증금 상한 (만원)">
              <TextInput value={maxDeposit} onChange={setMaxDeposit} placeholder="예: 3000" type="number" />
            </Section>
            <Section label="월세 상한 (만원)">
              <TextInput value={maxMonthlyRent} onChange={setMaxMonthlyRent} placeholder="예: 60" type="number" />
            </Section>
            <Section label="전용면적 최소 (㎡)">
              <TextInput value={minAreaSqm} onChange={setMinAreaSqm} placeholder="예: 20" type="number" />
            </Section>
            <Section label="방 개수 최소">
              <TextInput value={minRooms} onChange={setMinRooms} placeholder="예: 1" type="number" />
            </Section>
          </div>

          <Section label="원하는 지역 / 지하철역">
            <TextInput
              value={desiredStation}
              onChange={setDesiredStation}
              placeholder="예: 강남역, 2호선"
            />
          </Section>

          <Section label="꼭 있었으면 하는 옵션">
            <div className="flex flex-wrap gap-1.5">
              {OPTION_ITEMS.map((item) => {
                const active = requiredOptions.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleOption(item)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-bold"
                    style={{
                      background: active ? "#E2F6EF" : "#fff",
                      color: active ? "#0B7355" : "#5B6B8C",
                      border: `1px solid ${active ? "#0B7355" : "rgba(13,27,52,.1)"}`,
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section label="주차">
            <button
              type="button"
              onClick={() => setRequireParking((v) => !v)}
              className="rounded-xl border px-3.5 py-3 text-[13px] font-bold"
              style={{
                borderColor: requireParking ? "#2B5BE2" : "rgba(13,27,52,.1)",
                background: requireParking ? "#E8EEFD" : "#fff",
                color: requireParking ? "#1D3FAF" : "#5B6B8C",
              }}
            >
              {requireParking ? "✓ 주차 가능한 곳만" : "주차 가능 여부는 상관없음"}
            </button>
          </Section>

          <button
            type="button"
            onClick={resetAll}
            className="self-start text-[12.5px] font-bold text-ink-light underline underline-offset-2"
          >
            조건 전체 초기화
          </button>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center border-t border-line bg-bg-screen/95 px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="w-full max-w-md">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-primary py-4 text-[14.5px] font-bold text-white shadow-cta disabled:opacity-60"
            >
              {submitting ? "저장 중..." : "조건 저장하기"}
            </button>
          </div>
        </div>
      </form>
    </PageShell>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold text-ink-muted">{label}</p>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      inputMode={type === "number" ? "numeric" : undefined}
      className="w-full min-w-0 rounded-2xl border border-line bg-white px-3.5 py-3 text-[13.5px] font-medium text-ink outline-none focus:border-primary"
    />
  );
}
