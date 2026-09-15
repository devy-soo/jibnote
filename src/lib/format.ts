import type { Listing } from "../types";

export function formatManwon(manwon: number): string {
  if (!manwon || manwon <= 0) return "0원";
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString("ko-KR")}만원`;
  if (eok > 0) return `${eok}억`;
  return `${rest.toLocaleString("ko-KR")}만원`;
}

export function formatDepositShort(manwon: number): string {
  if (!manwon || manwon <= 0) return "0";
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString("ko-KR")}`;
  if (eok > 0) return `${eok}억`;
  return rest.toLocaleString("ko-KR");
}

export function formatDealPrice(
  listing: Pick<Listing, "dealType" | "deposit" | "monthlyRent">,
): string {
  if (listing.dealType === "월세") {
    return `${formatDepositShort(listing.deposit)} / ${listing.monthlyRent ?? 0}만원`;
  }
  return formatManwon(listing.deposit);
}

export function formatMeta(listing: Listing): string {
  const parts = [listing.area, listing.floor];
  if (listing.walkMinutes != null) parts.push(`역 도보 ${listing.walkMinutes}분`);
  return parts.filter(Boolean).join(" · ");
}

export function formatSavedDate(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
