const GEMINI_MODEL = "gemini-3.5-flash";

export interface ExtractedAgent {
  name?: string;
  phone?: string;
}

export interface ExtractedListing {
  title?: string;
  listingNumber?: string;
  platform?: string;
  sourceUrl?: string;
  buildingType?: string;
  dealType?: "전세" | "월세" | "반전세" | "매매";
  deposit?: number;
  monthlyRent?: number;
  areaSqm?: number;
  rooms?: number;
  floorNumber?: number;
  direction?: string;
  totalFloors?: number;
  approvalDate?: string;
  isViolationBuilding?: boolean;
  parkingAvailable?: boolean;
  options?: string[];
  maintenanceFee?: number;
  walkMinutes?: number;
  nearestStation?: string;
  address?: string;
  agents?: ExtractedAgent[];
  /** 캡처 이미지 안에 매물 사진(집 내부/외부)이 있으면 그 영역, 0~1000 정규화 좌표 */
  photoBox?: { xmin: number; ymin: number; xmax: number; ymax: number };
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    listingNumber: { type: "string" },
    platform: { type: "string" },
    sourceUrl: { type: "string" },
    buildingType: { type: "string" },
    dealType: { type: "string", enum: ["전세", "월세", "반전세", "매매"] },
    deposit: { type: "number" },
    monthlyRent: { type: "number" },
    areaSqm: { type: "number" },
    rooms: { type: "number" },
    floorNumber: { type: "number" },
    direction: {
      type: "string",
      enum: ["남향", "남동향", "남서향", "동향", "서향", "북향", "북동향", "북서향"],
    },
    totalFloors: { type: "number" },
    approvalDate: { type: "string" },
    isViolationBuilding: { type: "boolean" },
    parkingAvailable: { type: "boolean" },
    options: { type: "array", items: { type: "string" } },
    maintenanceFee: { type: "number" },
    walkMinutes: { type: "number" },
    nearestStation: { type: "string" },
    address: { type: "string" },
    agents: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
        },
      },
    },
    photoBox: {
      type: "object",
      properties: {
        xmin: { type: "number" },
        ymin: { type: "number" },
        xmax: { type: "number" },
        ymax: { type: "number" },
      },
    },
  },
};

const PROMPT = `이 이미지는 한국 부동산 매물(전세/월세/반전세/매매) 정보 화면 캡처야. 아래 항목을 이미지에서 최대한 정확히 읽어서 추출해줘. 금액은 전부 "만원" 기준 숫자로 변환해줘 (예: "1억 5천" -> 15000, "1,500" -> 1500).

- title: 단지명 또는 매물명
- listingNumber: 매물번호 (있는 경우)
- platform: 이 화면이 어느 부동산 플랫폼인지 (KB부동산, 네이버부동산, 직방, 다방, 피터팬의좋은방구하기 등 화면에서 유추 가능하면)
- sourceUrl: 화면에 보이는 매물 상세 페이지 URL (주소창 등에 보이면)
- buildingType: 건축물 용도/종류 (다가구주택, 다세대주택(빌라), 단독주택, 오피스텔, 아파트, 상가주택, 근린생활시설 중 유추 가능한 것)
- dealType: "전세" / "월세" / "반전세" / "매매" 중 하나
- deposit: 보증금(전세금·매매가 포함), 만원 단위 숫자
- monthlyRent: 월세, 만원 단위 숫자 (월세·반전세일 때만)
- areaSqm: 전용면적, 제곱미터(㎡) 단위 숫자만 (평수만 있으면 3.3058을 곱해서 ㎡로 환산)
- rooms: 방 개수, 숫자만
- floorNumber: 이 매물이 있는 층수, 숫자만 (반지하/지하는 음수나 0, 예: 반지하는 0)
- direction: 방향 (남향/남동향/남서향/동향/서향/북향/북동향/북서향 중 하나, 명시돼 있을 때만)
- totalFloors: 건물 총 층수, 숫자만
- approvalDate: 사용승인일 (예: "2010-05" 형식, 연월만 있으면 연월까지만)
- isViolationBuilding: 위반건축물 여부 (true/false, 명시돼 있을 때만)
- parkingAvailable: 주차 가능 여부 (true/false, 명시돼 있을 때만)
- options: 풀옵션/옵션 항목 배열 (냉장고, 세탁기, 에어컨, 가스레인지/인덕션, 옷장, 책상, 침대, TV, 신발장, 전자레인지 중 화면에 보이는 것만)
- maintenanceFee: 관리비, 만원 단위 숫자
- walkMinutes: 역까지 도보 시간, 분 단위 숫자
- nearestStation: 가까운 지하철역 이름 (예: "2호선 강남역")
- address: 주소
- agents: 중개사무소/담당자 목록. 여러 명이면 배열로 모두 담고, 각 항목은 name(중개사무소명 또는 담당자명), phone(연락처)
- photoBox: 이미지 안에 집 내부/외부를 찍은 매물 사진(실제 방·거실·건물 외관 사진)이 포함돼 있으면, 그 사진 영역의 bounding box를 xmin, ymin, xmax, ymax로 담아줘. 좌표는 이미지 전체 너비/높이를 1000으로 봤을 때의 정규화된 값이야 (왼쪽 위가 0,0). 여러 장이면 가장 큰/대표 사진 하나만. 지도, 아이콘, 로고, 표 같은 건 매물 사진이 아니니까 제외하고, 매물 사진이 전혀 없으면 photoBox는 생략해.

이미지에서 확인할 수 없는 항목은 결과에서 그냥 생략해 (추측해서 지어내지 마).`;

const URL_PROMPT = `아래는 한국 부동산 매물(전세/월세/반전세/매매) 상세 페이지에서 가져온 텍스트야 (og 메타태그 + 본문 텍스트, 자바스크립트 렌더링 전이라 일부 정보가 빠져있을 수 있어). 이 텍스트에서 알아낼 수 있는 항목만 최대한 정확히 추출해줘. 금액은 전부 "만원" 기준 숫자로 변환해줘 (예: "1억 5천" -> 15000, "1,500" -> 1500).

- title: 단지명 또는 매물명
- listingNumber: 매물번호 (있는 경우)
- platform: 어느 부동산 플랫폼인지 (KB부동산, 네이버부동산, 직방, 다방, 피터팬의좋은방구하기 등 URL이나 텍스트에서 유추 가능하면)
- buildingType: 건축물 용도/종류 (다가구주택, 다세대주택(빌라), 단독주택, 오피스텔, 아파트, 상가주택, 근린생활시설 중 유추 가능한 것)
- dealType: "전세" / "월세" / "반전세" / "매매" 중 하나
- deposit: 보증금(전세금·매매가 포함), 만원 단위 숫자
- monthlyRent: 월세, 만원 단위 숫자 (월세·반전세일 때만)
- areaSqm: 전용면적, 제곱미터(㎡) 단위 숫자만 (평수만 있으면 3.3058을 곱해서 ㎡로 환산)
- rooms: 방 개수, 숫자만
- floorNumber: 이 매물이 있는 층수, 숫자만 (반지하/지하는 음수나 0)
- direction: 방향 (남향/남동향/남서향/동향/서향/북향/북동향/북서향 중 하나, 명시돼 있을 때만)
- totalFloors: 건물 총 층수, 숫자만
- approvalDate: 사용승인일 (예: "2010-05" 형식, 연월만 있으면 연월까지만)
- isViolationBuilding: 위반건축물 여부 (true/false, 명시돼 있을 때만)
- parkingAvailable: 주차 가능 여부 (true/false, 명시돼 있을 때만)
- options: 풀옵션/옵션 항목 배열 (냉장고, 세탁기, 에어컨, 가스레인지/인덕션, 옷장, 책상, 침대, TV, 신발장, 전자레인지 중 텍스트에 보이는 것만)
- maintenanceFee: 관리비, 만원 단위 숫자
- walkMinutes: 역까지 도보 시간, 분 단위 숫자
- nearestStation: 가까운 지하철역 이름 (예: "2호선 강남역")
- address: 주소
- agents: 중개사무소/담당자 목록. 여러 명이면 배열로 모두 담고, 각 항목은 name(중개사무소명 또는 담당자명), phone(연락처)

텍스트에서 확인할 수 없는 항목은 결과에서 그냥 생략해 (추측해서 지어내지 마). 이 페이지가 부동산 매물 페이지가 아니거나 내용을 알아볼 수 없으면 빈 객체를 반환해.`;

const MAX_ATTEMPTS = 3;
const RETRY_STATUS = new Set([429, 503]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(parts: object[], apiKey: string): Promise<Response> {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    },
  );
}

async function extractWithRetry(parts: object[]): Promise<ExtractedListing> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았어요.");
  }

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await callGemini(parts, apiKey);
    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini API returned no content");
      return JSON.parse(text) as ExtractedListing;
    }

    lastError = `Gemini API error ${res.status}: ${await res.text().catch(() => "")}`;
    if (!RETRY_STATUS.has(res.status) || attempt === MAX_ATTEMPTS) {
      throw new Error(lastError);
    }
    console.warn(`Gemini attempt ${attempt} failed (${res.status}), retrying...`);
    await sleep(attempt * 1000);
  }

  throw new Error(lastError);
}

export async function extractListingFromImage(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractedListing> {
  return extractWithRetry([
    { text: PROMPT },
    { inlineData: { mimeType, data: buffer.toString("base64") } },
  ]);
}

export async function extractListingFromText(pageText: string): Promise<ExtractedListing> {
  return extractWithRetry([{ text: `${URL_PROMPT}\n\n---\n${pageText}` }]);
}
