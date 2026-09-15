export type DealType = "전세" | "월세";

export type ListingStatus = "관심" | "방문예정" | "방문완료" | "계약진행";

export type ChecklistState = Record<string, boolean>;

export interface RatingState {
  light?: number; // 채광
  noise?: number; // 방음
  water?: number; // 수압
  transit?: number; // 교통
  surroundings?: number; // 주변환경
}

export type RatingKey = keyof RatingState;

export interface Photo {
  id: string;
  url: string;
}

export interface Listing {
  id: string;
  title: string;
  dealType: DealType;
  /** 보증금(전세금 포함), 단위: 만원 */
  deposit: number;
  /** 월세, 단위: 만원 (dealType이 월세일 때만 사용) */
  monthlyRent?: number;
  /** 예: "39.6㎡ (12평)" */
  area?: string;
  /** 예: "3층 / 남향" */
  floor?: string;
  /** 관리비, 단위: 만원 */
  maintenanceFee?: number;
  /** 역까지 도보 분 */
  walkMinutes?: number;
  address?: string;
  agentName?: string;
  agentPhone?: string;
  memo?: string;
  tags: string[];
  status: ListingStatus;
  saved: boolean;
  photos: Photo[];
  checklist: ChecklistState;
  ratings: RatingState;
  visitNote?: string;
  createdAt: number;
  updatedAt: number;
}
