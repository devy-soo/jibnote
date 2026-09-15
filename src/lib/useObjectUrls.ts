import { useEffect, useRef, useState } from "react";

function sameBlobs(a: Blob[], b: Blob[]) {
  if (a.length !== b.length) return false;
  return a.every((blob, i) => blob === b[i]);
}

/**
 * Blob 배열을 object URL 배열로 변환하고, 언마운트/변경 시 자동으로 해제한다.
 * 매 렌더마다 새 배열(예: `arr.slice(0,1)`)이 전달되어도, 내용이 같으면
 * 이전 배열을 그대로 재사용해 불필요한 재생성 루프를 막는다.
 */
export function useObjectUrls(blobs: Blob[] | undefined): string[] {
  const stableRef = useRef<Blob[]>([]);
  const incoming = blobs ?? [];
  if (!sameBlobs(stableRef.current, incoming)) {
    stableRef.current = incoming;
  }
  const stable = stableRef.current;

  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    if (stable.length === 0) {
      setUrls([]);
      return;
    }
    const next = stable.map((b) => URL.createObjectURL(b));
    setUrls(next);
    return () => {
      next.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [stable]);

  return urls;
}
