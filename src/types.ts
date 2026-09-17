export type DealType = "전세" | "월세" | "반전세" | "매매";

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

export interface Agent {
  name: string;
  phone: string;
}

export interface Listing {
  id: string;
  title: string;
  /** 매물번호 (플랫폼에서 부여한 번호) */
  listingNumber?: string;
  /** 어느 플랫폼에서 본 매물인지 (네이버부동산, 직방 등) */
  platform?: string;
  dealType: DealType;
  /** 보증금(전세금·매매가 포함), 단위: 만원 */
  deposit: number;
  /** 월세, 단위: 만원 (dealType이 월세/반전세일 때만 사용) */
  monthlyRent?: number;
  /** 전용면적, 제곱미터(㎡) 단위 */
  areaSqm?: number;
  /** 방 개수 */
  rooms?: number;
  /** 예: "3층 / 남향" */
  floor?: string;
  /** 관리비, 단위: 만원 */
  maintenanceFee?: number;
  /** 관리비에 포함된 항목 (예: 수도, 인터넷) */
  maintenanceFeeIncludes: string[];
  /** 역까지 도보 분 */
  walkMinutes?: number;
  /** 가까운 지하철역 (예: "2호선 강남역") */
  nearestStation?: string;
  address?: string;
  agents: Agent[];
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
