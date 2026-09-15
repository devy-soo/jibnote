import { CHECKLIST_GROUPS } from "../constants/checklist";
import type { ChecklistState, RatingState } from "../types";

export function checklistTotals(checklist: ChecklistState) {
  let total = 0;
  let done = 0;
  for (const group of CHECKLIST_GROUPS) {
    for (const item of group.items) {
      total++;
      if (checklist[item.id]) done++;
    }
  }
  return { total, done };
}

/** 5개 항목 별점의 평균. 아직 평가한 항목이 없으면 null. */
export function overallScore(ratings: RatingState): number | null {
  const values = Object.values(ratings).filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function scoreToPercent(score: number | null): string {
  if (score == null) return "0%";
  return `${Math.min(100, Math.round((score / 5) * 100))}%`;
}
