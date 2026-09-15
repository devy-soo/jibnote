import { useState } from "react";
import type { Photo } from "../types";
import { resolveUploadUrl } from "../api/client";

export function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#C9D8F2] to-[#9FB6E0]">
        <span className="text-[12px] font-semibold text-ink-muted">등록된 사진이 없어요</span>
      </div>
    );
  }

  const current = Math.min(index, photos.length - 1);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#DCE5F8]">
      <img src={resolveUploadUrl(photos[current].url)} alt="" className="h-full w-full object-cover" />
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85"
            aria-label="이전 사진"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D1B34" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % photos.length)}
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
