import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { PhotoCarousel } from "../components/PhotoCarousel";
import { StatusBadge } from "../components/StatusBadge";
import { StarRating } from "../components/StarRating";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useListingStore } from "../store/useListingStore";
import { useToast } from "../components/ToastProvider";
import { CHECKLIST_GROUPS } from "../constants/checklist";
import { RATING_FIELDS } from "../constants/ratings";
import { checklistTotals, overallScore } from "../lib/score";
import { formatDealPrice, formatManwon, formatSavedDate } from "../lib/format";
import type { RatingKey } from "../types";

type Tab = "info" | "checklist";

export function ListingDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const loaded = useListingStore((s) => s.loaded);
  const listing = useListingStore((s) => s.listings.find((l) => l.id === id));
  const patchListing = useListingStore((s) => s.patchListing);
  const removeListing = useListingStore((s) => s.removeListing);
  const toggleSaved = useListingStore((s) => s.toggleSaved);

  const [tab, setTab] = useState<Tab>("info");
  const [memoDraft, setMemoDraft] = useState<string | null>(null);
  const [visitNoteDraft, setVisitNoteDraft] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!listing) {
    return (
      <PageShell>
        <div className="p-6 text-center text-sm font-semibold text-ink-muted">
          {loaded ? "매물을 찾을 수 없어요." : "불러오는 중..."}
        </div>
      </PageShell>
    );
  }

  const { total, done } = checklistTotals(listing.checklist);
  const score = overallScore(listing.ratings);
  const memo = memoDraft ?? listing.memo ?? "";
  const visitNote = visitNoteDraft ?? listing.visitNote ?? "";

  function toggleItem(itemId: string) {
    patchListing(listing!.id, {
      checklist: { ...listing!.checklist, [itemId]: !listing!.checklist[itemId] },
    });
  }

  function setRating(key: RatingKey, value: number) {
    patchListing(listing!.id, { ratings: { ...listing!.ratings, [key]: value } });
  }

  return (
    <PageShell>
      <div className="pb-28">
        <div className="relative h-[220px]">
          <PhotoCarousel photos={listing.photos} />
          <button
            type="button"
            onClick={() => navigate("/")}
            className="absolute left-4 top-3.5 grid h-9 w-9 place-items-center rounded-xl bg-white/92 shadow-card"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D1B34" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => toggleSaved(listing.id)}
            className="absolute right-4 top-3.5 grid h-9 w-9 place-items-center rounded-xl bg-white/92 shadow-card"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill={listing.saved ? "#2B5BE2" : "none"}
              stroke={listing.saved ? "#2B5BE2" : "#8392AE"}
              strokeWidth="2.2"
              strokeLinejoin="round"
            >
              <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.4L5.5 20.5v-16a1 1 0 0 1 1-1z" />
            </svg>
          </button>
        </div>

        <div className="relative -mt-6 rounded-t-3xl bg-bg-screen px-5 pt-5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <StatusBadge status={listing.status} />
            <span className="text-[11.5px] font-semibold text-ink-muted">
              {listing.dealType} · {formatSavedDate(listing.createdAt)} 저장
            </span>
          </div>
          <h1 className="mb-1.5 text-[22px] font-bold tracking-tight text-ink">{listing.title}</h1>
          <p className="mb-1 text-[19px] font-bold tracking-tight text-primary-dark">
            {formatDealPrice(listing)}
          </p>
          {listing.address && (
            <div className="mb-4 flex items-center gap-2">
              <p className="text-[13px] font-medium text-ink-faint">{listing.address}</p>
              <a
                href={`https://map.naver.com/p/search/${encodeURIComponent(listing.address)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-none text-[12px] font-bold text-primary"
              >
                지도에서 보기
              </a>
            </div>
          )}

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => navigate(`/listing/${listing.id}/edit`)}
              className="rounded-xl border border-line bg-white px-3.5 py-2 text-[12.5px] font-bold text-ink-soft"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-[12.5px] font-bold text-rose-500"
            >
              삭제
            </button>
          </div>

          <div className="mb-[18px] flex gap-1.5 rounded-2xl bg-chip p-1">
            <button
              type="button"
              onClick={() => setTab("info")}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-bold"
              style={{ background: tab === "info" ? "#fff" : "transparent", color: tab === "info" ? "#1D3FAF" : "#5B6B8C" }}
            >
              매물 상세
            </button>
            <button
              type="button"
              onClick={() => setTab("checklist")}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-bold"
              style={{ background: tab === "checklist" ? "#fff" : "transparent", color: tab === "checklist" ? "#1D3FAF" : "#5B6B8C" }}
            >
              체크리스트 {done}/{total}
            </button>
          </div>

          {tab === "info" ? (
            <div className="animate-fade-in flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2.5">
                <InfoTile label="전용 면적" value={listing.area || "미입력"} />
                <InfoTile label="층 / 방향" value={listing.floor || "미입력"} />
                <InfoTile
                  label="관리비"
                  value={listing.maintenanceFee ? formatManwon(listing.maintenanceFee) : "미입력"}
                />
                <InfoTile
                  label="역까지"
                  value={listing.walkMinutes ? `도보 ${listing.walkMinutes}분` : "미입력"}
                />
              </div>

              <div className="rounded-3xl border border-line bg-white p-[18px]">
                <div className="mb-4 flex items-baseline justify-between">
                  <h3 className="text-[15.5px] font-bold text-ink">방문 평가 점수</h3>
                  <span className="text-[13px] font-bold text-primary">
                    {score ? score.toFixed(1) : "-"} / 5.0
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {RATING_FIELDS.map((f) => (
                    <div key={f.key} className="flex items-center justify-between gap-3">
                      <span className="w-14 flex-none text-[12px] font-semibold text-ink-muted">{f.label}</span>
                      <StarRating value={listing.ratings[f.key] ?? 0} onChange={(v) => setRating(f.key, v)} size={18} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-line bg-white p-[18px]">
                <h3 className="mb-3 text-[15.5px] font-bold text-ink">내 메모</h3>
                <textarea
                  value={memo}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  onBlur={() => {
                    if (memoDraft !== null) patchListing(listing.id, { memo: memoDraft });
                  }}
                  rows={3}
                  placeholder="느낀 점, 확인할 사항을 적어두세요"
                  className="w-full resize-none rounded-xl border border-line bg-bg-soft p-3 text-[13.5px] leading-relaxed text-ink outline-none focus:border-primary focus:bg-white"
                />
                {listing.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {listing.tags.map((t) => (
                      <span key={t} className="rounded-lg bg-chip px-2.5 py-1 text-[11.5px] font-bold text-ink-soft">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {(listing.agentName || listing.agentPhone) && (
                <div className="flex items-center gap-3 rounded-3xl border border-line bg-white p-[18px]">
                  <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gradient-to-br from-[#7FA6FF] to-[#2450C8] text-[15px] font-bold text-white">
                    {(listing.agentName || "중").slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink">{listing.agentName || "중개사 미입력"}</p>
                    {listing.agentPhone && (
                      <p className="mt-0.5 text-[12px] font-semibold text-ink-faint">{listing.agentPhone}</p>
                    )}
                  </div>
                  {listing.agentPhone && (
                    <a
                      href={`tel:${listing.agentPhone}`}
                      className="flex-none rounded-xl bg-chip px-3 py-2 text-[12px] font-bold text-primary-dark"
                    >
                      전화
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in flex flex-col gap-4">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D3FAF] to-[#16307A] p-[18px]">
                <div className="relative mb-3 flex items-end justify-between">
                  <div>
                    <p className="mb-1 text-[12px] font-semibold text-white/70">확인한 항목</p>
                    <p className="text-[22px] font-bold tracking-tight text-white">
                      {done}
                      <span className="text-[14px] font-semibold text-white/65"> / {total}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-[12px] font-semibold text-white/70">평가 점수</p>
                    <p className="text-[22px] font-bold tracking-tight text-emerald-300">
                      {score ? score.toFixed(1) : "-"}
                    </p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-sky-300 transition-all"
                    style={{ width: total ? `${Math.round((done / total) * 100)}%` : "0%" }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3.5">
                {CHECKLIST_GROUPS.map((group) => {
                  const groupDone = group.items.filter((it) => listing.checklist[it.id]).length;
                  return (
                    <div key={group.id} className="rounded-3xl border border-line bg-white px-4 pb-1.5 pt-4">
                      <div className="mb-2.5 flex items-center gap-2.5">
                        <div
                          className="grid h-[34px] w-[34px] flex-none place-items-center rounded-xl text-[13px] font-extrabold text-white"
                          style={{ background: group.gradient }}
                        >
                          {group.initial}
                        </div>
                        <h3 className="flex-1 text-[15px] font-bold text-ink">{group.name}</h3>
                        <span className="text-[11.5px] font-bold text-ink-muted">
                          {groupDone}/{group.items.length}
                        </span>
                      </div>
                      <div>
                        {group.items.map((item) => {
                          const isDone = !!listing.checklist[item.id];
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleItem(item.id)}
                              className="flex w-full items-center gap-3 border-t border-line py-2.5 text-left"
                            >
                              <span
                                className="grid h-6 w-6 flex-none place-items-center rounded-lg border-[1.5px]"
                                style={{
                                  borderColor: isDone ? "#2B5BE2" : "rgba(13,27,52,.2)",
                                  background: isDone ? "#2B5BE2" : "#fff",
                                }}
                              >
                                {isDone && (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12.5 9.5 17 19 7" />
                                  </svg>
                                )}
                              </span>
                              <span
                                className="flex-1 text-[13.5px] font-semibold"
                                style={{
                                  color: isDone ? "#5B6B8C" : "#0D1B34",
                                  textDecoration: isDone ? "line-through" : "none",
                                }}
                              >
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-line bg-white p-[18px]">
                <h3 className="mb-2.5 text-[15px] font-bold text-ink">방문 메모</h3>
                <textarea
                  value={visitNote}
                  onChange={(e) => setVisitNoteDraft(e.target.value)}
                  onBlur={() => {
                    if (visitNoteDraft !== null) patchListing(listing.id, { visitNote: visitNoteDraft });
                  }}
                  rows={3}
                  placeholder="현장에서 느낀 점을 적어두세요"
                  className="w-full resize-none rounded-xl border border-line bg-bg-soft p-3 text-[13.5px] leading-relaxed text-ink outline-none focus:border-primary focus:bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center border-t border-line bg-bg-screen/95 px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="flex w-full max-w-md gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (tab === "info") {
                setTab("checklist");
              } else {
                setTab("info");
                showToast(`체크리스트 ${done}개 항목을 저장했어요`);
              }
            }}
            className="flex-1 rounded-2xl py-4 text-[14.5px] font-bold text-white"
            style={{ background: tab === "info" ? "#2B5BE2" : "#0E8E68" }}
          >
            {tab === "info" ? "방문 체크리스트 작성" : "체크리스트 저장하고 나가기"}
          </button>
          <button
            type="button"
            onClick={() => toggleSaved(listing.id)}
            className="flex-none rounded-2xl border border-line bg-white px-5 py-4 text-[14.5px] font-bold text-primary-dark"
          >
            {listing.saved ? "저장됨" : "저장"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="이 매물을 삭제할까요?"
        description="삭제한 매물과 메모, 사진은 되돌릴 수 없어요."
        confirmLabel="삭제"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          try {
            await removeListing(listing.id);
            showToast("매물을 삭제했어요");
            navigate("/");
          } catch {
            showToast("삭제에 실패했어요. 다시 시도해 주세요");
          }
        }}
      />
    </PageShell>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3.5">
      <p className="mb-1 text-[11.5px] font-semibold text-ink-muted">{label}</p>
      <p className="text-[15px] font-bold text-ink">{value}</p>
    </div>
  );
}
