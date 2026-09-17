export interface ChecklistItem {
  id: string;
  label: string;
}

export interface ChecklistGroup {
  id: string;
  name: string;
  initial: string;
  gradient: string;
  items: ChecklistItem[];
}

export const CHECKLIST_GROUPS: ChecklistGroup[] = [
  {
    id: "light",
    name: "채광 · 누수 · 환기",
    initial: "채",
    gradient: "linear-gradient(155deg,#FFD08A,#E8912A)",
    items: [
      { id: "light-1", label: "오전/오후 햇빛이 실제로 드는지 확인" },
      { id: "light-2", label: "창문 개수와 맞통풍 여부" },
      { id: "light-3", label: "곰팡이·결로 흔적" },
      { id: "light-4", label: "천장·벽·창틀에 누수 흔적이 있는지" },
      { id: "light-5", label: "겨울철 외풍(웃풍)이 심하지 않은지" },
    ],
  },
  {
    id: "water",
    name: "수압 · 배수 · 보일러",
    initial: "수",
    gradient: "linear-gradient(155deg,#7FD8EA,#0E8FB0)",
    items: [
      { id: "water-1", label: "싱크대·샤워기 동시에 틀어보기" },
      { id: "water-2", label: "변기 물 내려가는 속도" },
      { id: "water-3", label: "온수 나오는 시간" },
      { id: "water-4", label: "보일러가 정상 작동하는지 (난방 확인)" },
      { id: "water-5", label: "전기·수도 계량기가 세대별로 분리돼 있는지" },
    ],
  },
  {
    id: "noise",
    name: "방음 · 층간소음",
    initial: "방",
    gradient: "linear-gradient(155deg,#AE97F5,#6B48D6)",
    items: [
      { id: "noise-1", label: "창문 닫고 도로 소음 확인" },
      { id: "noise-2", label: "복도·현관문 소음" },
      { id: "noise-3", label: "위층 발소리 확인" },
    ],
  },
  {
    id: "facility",
    name: "주방 · 욕실 시설",
    initial: "시",
    gradient: "linear-gradient(155deg,#8FE0C4,#0E8E68)",
    items: [
      { id: "facility-1", label: "싱크대·수납장·상판 파손 여부" },
      { id: "facility-2", label: "가스레인지/인덕션 설치 여부" },
      { id: "facility-3", label: "냉장고·세탁기 놓을 공간이 있는지" },
      { id: "facility-4", label: "욕실 변기·샤워기·거울 파손 여부" },
      { id: "facility-5", label: "콘센트·전등 파손 여부" },
    ],
  },
  {
    id: "security",
    name: "보안 · 주차",
    initial: "안",
    gradient: "linear-gradient(155deg,#7FA6FF,#2B5BE2)",
    items: [
      { id: "security-1", label: "공동현관 잠금장치·CCTV" },
      { id: "security-2", label: "밤길 가로등 상태" },
      { id: "security-3", label: "방범창·방충망 설치 여부" },
      { id: "security-4", label: "주차 대수와 저녁 상황" },
      { id: "security-5", label: "분리수거장 위치" },
    ],
  },
  {
    id: "location",
    name: "입지 · 생활환경",
    initial: "입",
    gradient: "linear-gradient(155deg,#7FC8EA,#1D7FAF)",
    items: [
      { id: "location-1", label: "편의점·마트가 가까운지" },
      { id: "location-2", label: "학교·어린이집·병원이 가까운지" },
      { id: "location-3", label: "지하철·버스정류장 도보 10분 이내인지" },
      { id: "location-4", label: "공장·악취·혐오시설이 주변에 없는지" },
    ],
  },
  {
    id: "contract",
    name: "서류 · 계약 체크 (전세사기 예방)",
    initial: "계",
    gradient: "linear-gradient(155deg,#FF9E9E,#D6394A)",
    items: [
      { id: "contract-1", label: "등기부등본상 근저당 여부 확인" },
      { id: "contract-2", label: "집주인 신분증과 등기부등본 소유자 일치 확인" },
      { id: "contract-3", label: "전입세대 열람으로 다른 세입자 확인" },
      { id: "contract-4", label: "근저당+보증금 합이 집값의 60%를 넘지 않는지" },
      { id: "contract-5", label: "잔금일에 확정일자·전입신고 계획 확인" },
      { id: "contract-6", label: "관리비 항목이 과하지 않은지 확인" },
    ],
  },
];
