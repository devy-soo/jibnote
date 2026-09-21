import type { Listing, Preferences } from "../types";

export interface MatchCriterion {
  label: string;
  met: boolean;
}

export interface MatchResult {
  met: number;
  total: number;
  percent: number;
  /** 0~5, 반올림 */
  stars: number;
  criteria: MatchCriterion[];
}

/** 설정된 조건이 하나도 없으면 null (매칭할 게 없음). */
export function computeMatch(listing: Listing, prefs: Preferences): MatchResult | null {
  const criteria: MatchCriterion[] = [];

  if (prefs.maxDeposit != null) {
    criteria.push({
      label: `보증금 ${prefs.maxDeposit}만원 이하`,
      met: listing.deposit <= prefs.maxDeposit,
    });
  }
  if (prefs.maxMonthlyRent != null) {
    criteria.push({
      label: `월세+관리비 ${prefs.maxMonthlyRent}만원 이하`,
      met: (listing.monthlyRent ?? 0) + (listing.maintenanceFee ?? 0) <= prefs.maxMonthlyRent,
    });
  }
  if (prefs.minAreaSqm != null) {
    criteria.push({
      label: `전용면적 ${prefs.minAreaSqm}㎡ 이상`,
      met: listing.areaSqm != null && listing.areaSqm >= prefs.minAreaSqm,
    });
  }
  if (prefs.minRooms != null) {
    criteria.push({
      label: `방 ${prefs.minRooms}개 이상`,
      met: listing.rooms != null && listing.rooms >= prefs.minRooms,
    });
  }
  const station = prefs.desiredStation?.trim();
  if (station) {
    criteria.push({
      label: `"${station}" 인근`,
      met: !!listing.nearestStation?.includes(station) || !!listing.address?.includes(station),
    });
  }
  for (const option of prefs.requiredOptions) {
    criteria.push({ label: `${option} 있음`, met: listing.options.includes(option) });
  }
  if (prefs.requireParking) {
    criteria.push({ label: "주차 가능", met: listing.parkingAvailable === true });
  }

  if (criteria.length === 0) return null;

  const met = criteria.filter((c) => c.met).length;
  const total = criteria.length;
  return {
    met,
    total,
    percent: Math.round((met / total) * 100),
    stars: Math.round((met / total) * 5),
    criteria,
  };
}

export function hasPreferences(prefs: Preferences): boolean {
  return (
    prefs.maxDeposit != null ||
    prefs.maxMonthlyRent != null ||
    prefs.minAreaSqm != null ||
    prefs.minRooms != null ||
    !!prefs.desiredStation?.trim() ||
    prefs.requiredOptions.length > 0 ||
    !!prefs.requireParking
  );
}
