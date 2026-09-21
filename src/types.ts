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

export interface Preferences {
  /** 보증금 상한, 만원 */
  maxDeposit?: number;
  /** 월세 상한, 만원 */
  maxMonthlyRent?: number;
  /** 전용면적 하한, ㎡ */
  minAreaSqm?: number;
  /** 방 개수 하한 */
  minRooms?: number;
  /** 층수 하한 (listing.floor 텍스트에서 숫자를 추출해 비교) */
  minFloor?: number;
  /** 원하는 방향 (예: "남향", listing.floor 텍스트에 포함돼 있는지로 비교) */
  desiredDirection?: string;
  /** 원하는 지역/역 (자유 텍스트, 부분 일치) */
  desiredStation?: string;
  /** 꼭 있었으면 하는 옵션 항목들 */
  requiredOptions: string[];
  /** 주차 가능 여부가 꼭 필요한지 */
  requireParking?: boolean;
}

export interface Photo {
  id: string;
  url: string;
}

export interface Agent {
  name: string;
  phone: string;
  /** 이 담당자와 실제로 연락/방문했는지 */
  contacted?: boolean;
  /** 이 담당자의 친절도 별점 (1~5) */
  kindness?: number;
}

export interface Listing {
  id: string;
  title: string;
  /** 매물번호 (플랫폼에서 부여한 번호) */
  listingNumber?: string;
  /** 어느 플랫폼에서 본 매물인지 (네이버부동산, 직방 등) */
  platform?: string;
  /** 원본 매물 링크 */
  sourceUrl?: string;
  /** 건축물 용도 (다가구주택, 오피스텔 등) */
  buildingType?: string;
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
  /** 건물 총 층수 */
  totalFloors?: number;
  /** 사용승인일 (예: "2010-05") */
  approvalDate?: string;
  /** 위반건축물 여부 */
  isViolationBuilding?: boolean;
  /** 허위매물 의심 여부 */
  isFakeListing?: boolean;
  /** 주차 가능 여부 */
  parkingAvailable?: boolean;
  /** 옵션(풀옵션) 항목 (예: 냉장고, 세탁기) */
  options: string[];
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
