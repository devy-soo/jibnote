import { useNavigate } from "react-router-dom";
import type { Listing } from "../types";
import { StatusBadge } from "./StatusBadge";
import { ScoreBar } from "./ScoreBar";
import { resolveUploadUrl } from "../api/client";
import { formatDealPrice, formatMeta } from "../lib/format";
import { checklistTotals } from "../lib/score";
import { overallScore, scoreToPercent } from "../lib/score";

export function ListingCard({
  listing,
  onToggleSaved,
}: {
  listing: Listing;
  onToggleSaved: (id: string) => void;
}) {
  const navigate = useNavigate();
  const firstPhotoUrl = listing.photos[0] ? resolveUploadUrl(listing.photos[0].url) : null;
  const { total, done } = checklistTotals(listing.checklist);
  const score = overallScore(listing.ratings);

  return (
    <div className="animate-rise-in relative rounded-3xl border bg-white p-3.5" style={{ borderColor: listing.saved ? "rgba(43,91,226,.28)" : "rgba(13,27,52,.06)" }}>
      <button
        type="button"
        onClick={() => navigate(`/listing/${listing.id}`)}
        className="block w-full text-left"
      >
        <div className="flex gap-3.5">
          <div className="relative h-[88px] w-[88px] flex-none overflow-hidden rounded-[18px] bg-gradient-to-br from-[#DCE5F8] to-[#BFCFEE]">
            {firstPhotoUrl ? (
              <img src={firstPhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[10.5px] font-semibold text-[#40506D]">
                사진 없음
              </div>
            )}
            {listing.photos.length > 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-ink/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {listing.photos.length}장
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <div className="mb-1.5 flex items-center gap-1.5">
              <StatusBadge status={listing.status} />
              <span className="text-[11px] font-semibold text-ink-muted">{listing.dealType}</span>
            </div>
            <p className="mb-1 truncate text-[15px] font-bold text-ink">{listing.title}</p>
            <p className="mb-1 text-[13.5px] font-bold text-primary-dark">{formatDealPrice(listing)}</p>
            <p className="truncate text-[12px] font-medium text-ink-faint">{formatMeta(listing) || "정보 미입력"}</p>
          </div>
        </div>
        <div className="mt-3.5 flex items-center gap-2.5 border-t border-line pt-3">
          <span className="flex-none text-[11px] font-bold text-ink-muted">내 점수</span>
          <ScoreBar percent={scoreToPercent(score)} />
          <span className="flex-none text-[12.5px] font-bold text-ink">{score ? score.toFixed(1) : "-"}</span>
          <span className="flex-none text-[11.5px] font-semibold text-ink-light">
            체크 {done}/{total}
          </span>
        </div>
      </button>
      <button
        type="button"
        title="저장"
        onClick={() => onToggleSaved(listing.id)}
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-xl border"
        style={{
          borderColor: listing.saved ? "rgba(43,91,226,.4)" : "rgba(13,27,52,.1)",
          background: listing.saved ? "#E8EEFD" : "#fff",
        }}
      >
        <svg
          width="15"
          height="15"
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
  );
}
