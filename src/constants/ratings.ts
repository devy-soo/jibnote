import type { RatingKey } from "../types";

export const RATING_FIELDS: { key: RatingKey; label: string }[] = [
  { key: "light", label: "채광" },
  { key: "noise", label: "방음" },
  { key: "water", label: "수압" },
  { key: "transit", label: "교통" },
  { key: "surroundings", label: "주변환경" },
  { key: "agentKindness", label: "중개사 친절도" },
];
