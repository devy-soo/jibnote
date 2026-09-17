const GEMINI_MODEL = "gemini-3.5-flash";

export interface ExtractedListing {
  title?: string;
  dealType?: "전세" | "월세";
  deposit?: number;
  monthlyRent?: number;
  area?: string;
  floor?: string;
  maintenanceFee?: number;
  walkMinutes?: number;
  address?: string;
  agentName?: string;
  agentPhone?: string;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    dealType: { type: "string", enum: ["전세", "월세"] },
    deposit: { type: "number" },
    monthlyRent: { type: "number" },
    area: { type: "string" },
    floor: { type: "string" },
    maintenanceFee: { type: "number" },
    walkMinutes: { type: "number" },
    address: { type: "string" },
    agentName: { type: "string" },
    agentPhone: { type: "string" },
  },
};

const PROMPT = `이 이미지는 한국 부동산 매물(전세 또는 월세) 정보 화면 캡처야. 아래 항목을 이미지에서 최대한 정확히 읽어서 추출해줘. 단위는 전부 "만원" 기준 숫자로 변환해줘 (예: "1억 5천" -> 15000, "1,500" -> 1500).

- title: 단지명 또는 매물명
- dealType: "전세" 또는 "월세" 중 하나
- deposit: 보증금(전세금 포함), 만원 단위 숫자
- monthlyRent: 월세, 만원 단위 숫자 (월세일 때만)
- area: 전용면적 (원문 그대로, 예: "26.4㎡ (8평)")
- floor: 층/방향 (예: "3층 / 남향")
- maintenanceFee: 관리비, 만원 단위 숫자
- walkMinutes: 역까지 도보 시간, 분 단위 숫자
- address: 주소
- agentName: 중개사무소명 또는 담당자명
- agentPhone: 중개사 연락처

이미지에서 확인할 수 없는 항목은 결과에서 그냥 생략해 (추측해서 지어내지 마).`;

const MAX_ATTEMPTS = 3;
const RETRY_STATUS = new Set([429, 503]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(buffer: Buffer, mimeType: string, apiKey: string): Promise<Response> {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inlineData: { mimeType, data: buffer.toString("base64") } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    },
  );
}

export async function extractListingFromImage(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractedListing> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았어요.");
  }

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await callGemini(buffer, mimeType, apiKey);
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
