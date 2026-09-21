import { RENT_TYPES } from "../constants/dealTypes";
import type { Listing } from "../types";

const SQM_PER_PYEONG = 3.305785;

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
  if (RENT_TYPES.includes(listing.dealType)) {
    return `${formatDepositShort(listing.deposit)} / ${listing.monthlyRent ?? 0}만원`;
  }
  return formatManwon(listing.deposit);
}

export function sqmToPyeong(sqm: number): number {
  return Math.round((sqm / SQM_PER_PYEONG) * 10) / 10;
}

export function pyeongToSqm(pyeong: number): number {
  return Math.round(pyeong * SQM_PER_PYEONG * 100) / 100;
}

/** "75.8㎡ (22.9평)" 형태로 반환. sqm이 없으면 빈 문자열. */
export function formatArea(sqm: number | undefined): string {
  if (sqm == null) return "";
  return `${sqm}㎡ (${sqmToPyeong(sqm)}평)`;
}

/** "3층 / 남향", "3층", "남향" 등 있는 값만 조합해서 반환. 둘 다 없으면 빈 문자열. */
export function formatFloor(listing: Pick<Listing, "floorNumber" | "direction">): string {
  const parts = [];
  if (listing.floorNumber != null) parts.push(`${listing.floorNumber}층`);
  if (listing.direction) parts.push(listing.direction);
  return parts.join(" / ");
}

export function formatMeta(listing: Listing): string {
  const parts = [formatArea(listing.areaSqm), formatFloor(listing)];
  if (listing.rooms != null) parts.push(`방 ${listing.rooms}개`);
  if (listing.walkMinutes != null) parts.push(`역 도보 ${listing.walkMinutes}분`);
  return parts.filter(Boolean).join(" · ");
}

export function formatSavedDate(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
