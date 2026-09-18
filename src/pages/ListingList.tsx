import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { ListingCard } from "../components/ListingCard";
import { EmptyState } from "../components/EmptyState";
import { DeleteAccountDialog } from "../components/DeleteAccountDialog";
import { useToast } from "../components/ToastProvider";
import { useListingStore } from "../store/useListingStore";
import { useAuthStore } from "../store/useAuthStore";
import { FILTER_OPTIONS } from "../constants/statuses";
import { overallScore } from "../lib/score";
import type { ListingStatus } from "../types";

type SortMode = "recent" | "score-desc" | "score-asc" | "deposit-asc" | "rent-asc";

const SORT_LABEL: Record<SortMode, string> = {
  recent: "최근 저장순",
  "score-desc": "내 점수 높은순",
  "score-asc": "내 점수 낮은순",
  "deposit-asc": "보증금순",
  "rent-asc": "월세순",
};

export function ListingList() {
  const navigate = useNavigate();
  const listings = useListingStore((s) => s.listings);
  const toggleSaved = useListingStore((s) => s.toggleSaved);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"전체" | ListingStatus>("전체");
  const [sort, setSort] = useState<SortMode>("recent");
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const visible = useMemo(() => {
    let list = listings.filter((l) => filter === "전체" || l.status === filter);
    const q = query.trim();
    if (q) {
      list = list.filter((l) =>
        [l.title, l.address, l.nearestStation, l.memo, l.tags.join(" ")].join(" ").includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      if (sort === "recent") return b.createdAt - a.createdAt;
      if (sort === "deposit-asc") return a.deposit - b.deposit;
      if (sort === "rent-asc") return (a.monthlyRent ?? 0) - (b.monthlyRent ?? 0);
      const sa = overallScore(a.ratings) ?? -1;
      const sb = overallScore(b.ratings) ?? -1;
      return sort === "score-desc" ? sb - sa : sa - sb;
    });
    return list;
  }, [listings, filter, query, sort]);

  return (
    <PageShell>
      <div className="pb-28">
        <div className="px-5 pb-3.5 pt-7">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="truncate text-[11.5px] font-semibold text-ink-light">{user?.email}</p>
            <div className="flex flex-none items-center gap-2.5">
              <button
                type="button"
                onClick={logout}
                className="text-[11.5px] font-bold text-ink-light"
              >
                로그아웃
              </button>
              <span className="text-[11px] text-line">|</span>
              <button
                type="button"
                onClick={() => setDeleteAccountOpen(true)}
                className="text-[11.5px] font-bold text-ink-light"
              >
                회원 탈퇴
              </button>
            </div>
          </div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-[12.5px] font-semibold text-ink-muted">내 매물함</p>
              <h1 className="text-[23px] font-bold tracking-tight text-ink">
                저장한 매물 {listings.length}건
              </h1>
            </div>
            <div className="grid h-[42px] w-[42px] flex-none place-items-center rounded-full bg-primary text-white">
              <svg width="20" height="20" viewBox="0 0 64 64">
                <path d="M32 14 12 30v20a2 2 0 0 0 2 2h12V38h12v14h12a2 2 0 0 0 2-2V30L32 14z" fill="currentColor" />
              </svg>
            </div>
          </div>

          <div className="mb-3.5 flex items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 py-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8392AE" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="단지명, 지역, 지하철역, 메모 검색"
              className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] font-medium text-ink outline-none placeholder:text-ink-light"
            />
          </div>
        </div>

        <div className="zl-scroll flex gap-2 overflow-x-auto px-5 pb-3.5">
          {FILTER_OPTIONS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="flex-none whitespace-nowrap rounded-full border px-3.5 py-2 text-[12.5px] font-bold"
                style={{
                  borderColor: active ? "#2B5BE2" : "rgba(13,27,52,.1)",
                  background: active ? "#2B5BE2" : "#fff",
                  color: active ? "#fff" : "#4A5C7E",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-5 pb-2.5">
          <p className="text-[12.5px] font-semibold text-ink-muted">{visible.length}건</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="border-0 bg-transparent text-[12.5px] font-bold text-primary outline-none"
          >
            {(Object.keys(SORT_LABEL) as SortMode[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABEL[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3.5 px-5">
          {visible.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onToggleSaved={toggleSaved} />
          ))}
        </div>

        {listings.length === 0 && (
          <EmptyState
            title="아직 저장한 매물이 없어요"
            description="사진을 올리거나 직접 입력해서 첫 매물을 저장해 보세요"
          />
        )}
        {listings.length > 0 && visible.length === 0 && (
          <EmptyState
            title="조건에 맞는 매물이 없어요"
            description="필터를 바꾸거나 새 매물을 저장해 보세요"
          />
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center border-t border-line bg-bg-screen/95 px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => navigate("/new")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[14.5px] font-bold text-white shadow-cta"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
              <path d="M12 5.5v13M5.5 12h13" />
            </svg>
            새 매물 저장
          </button>
        </div>
      </div>

      <DeleteAccountDialog
        open={deleteAccountOpen}
        onCancel={() => setDeleteAccountOpen(false)}
        onConfirm={async (password) => {
          await deleteAccount(password);
          showToast("탈퇴 처리됐어요. 그동안 이용해 주셔서 감사해요");
        }}
      />
    </PageShell>
  );
}
