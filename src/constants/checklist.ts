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
    name: "채광 · 환기",
    initial: "채",
    gradient: "linear-gradient(155deg,#FFD08A,#E8912A)",
    items: [
      { id: "light-1", label: "오전/오후 햇빛이 실제로 드는지 확인" },
      { id: "light-2", label: "창문 개수와 맞통풍 여부" },
      { id: "light-3", label: "곰팡이·결로 흔적" },
    ],
  },
  {
    id: "water",
    name: "수압 · 배수",
    initial: "수",
    gradient: "linear-gradient(155deg,#7FD8EA,#0E8FB0)",
    items: [
      { id: "water-1", label: "싱크대·샤워기 동시에 틀어보기" },
      { id: "water-2", label: "변기 물 내려가는 속도" },
      { id: "water-3", label: "온수 나오는 시간" },
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
    id: "security",
    name: "주변 · 보안",
    initial: "주",
    gradient: "linear-gradient(155deg,#7FA6FF,#2B5BE2)",
    items: [
      { id: "security-1", label: "공동현관 잠금장치·CCTV" },
      { id: "security-2", label: "밤길 가로등 상태" },
      { id: "security-3", label: "주차 대수와 저녁 상황" },
      { id: "security-4", label: "분리수거장 위치" },
    ],
  },
];

export function checklistTotals(checklist: Record<string, boolean>) {
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
