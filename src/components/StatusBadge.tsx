import type { ListingStatus } from "../types";
import { statusStyle } from "../constants/statuses";

export function StatusBadge({ status }: { status: ListingStatus }) {
  const { ink, bg } = statusStyle(status);
  return (
    <span
      className="rounded-md px-1.5 py-1 text-[10.5px] font-bold leading-none"
      style={{ color: ink, background: bg }}
    >
      {status}
    </span>
  );
}
