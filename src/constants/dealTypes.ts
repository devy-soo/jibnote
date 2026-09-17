import type { DealType } from "../types";

export const DEAL_TYPES: DealType[] = ["전세", "월세", "반전세", "매매"];

/** 월세를 입력받는 거래유형 (보증금 + 월세 둘 다 사용) */
export const RENT_TYPES: DealType[] = ["월세", "반전세"];

export function depositLabel(dealType: DealType): string {
  switch (dealType) {
    case "매매":
      return "매매가 (만원)";
    case "전세":
      return "전세금 (만원)";
    default:
      return "보증금 (만원)";
  }
}
