import { useRef, useState } from "react";
import type { Photo } from "../types";
import { resolveUploadUrl } from "../api/client";

const SWIPE_THRESHOLD = 40;

export function PhotoCarousel({
  photos,
  onExpand,
}: {
  photos: Photo[];
  onExpand?: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  if (photos.length === 0) {
    return (
      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#C9D8F2] to-[#9FB6E0]">
        <span className="text-[12px] font-semibold text-ink-muted">등록된 사진이 없어요</span>
      </div>
    );
  }

  const current = Math.min(index, photos.length - 1);
  const goPrev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const goNext = () => setIndex((i) => (i + 1) % photos.length);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dy) > Math.abs(dx)) return;
    e.preventDefault();
    if (dx > SWIPE_THRESHOLD) goPrev();
    else if (dx < -SWIPE_THRESHOLD) goNext();
    else onExpand?.(current);
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#DCE5F8]">
      <img
        src={resolveUploadUrl(photos[current].url)}
        alt=""
        onClick={() => onExpand?.(current)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="h-full w-full cursor-pointer object-cover"
      />
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85"
            aria-label="이전 사진"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D1B34" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85"
            aria-label="다음 사진"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D1B34" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9.5 5 6.5 7-6.5 7" />
            </svg>
          </button>
          <span className="absolute bottom-3 right-4 rounded-lg bg-ink/55 px-2.5 py-1 text-[11px] font-bold text-white">
            {current + 1} / {photos.length}
          </span>
        </>
      )}
    </div>
  );
}
