import { GRID_SIZE, type GridSize } from "@/types";

const OPENAI_URL = "https://api.openai.com/v1/images";
// 배포 환경에 빈 값으로 등록돼도 기본 모델을 쓰도록 빈 문자열도 기본값으로 처리
const MODEL = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-flare-2026-09-08";
const TIMEOUT_MS = 60_000;

// 어차피 16·32칸으로 줄이므로 가장 빠르고 저렴한 품질로 충분하고,
// png는 1.7MB 정도라 투명 배경을 유지하면서 훨씬 가벼운 webp(약 100KB)로 받음
const OUTPUT_OPTIONS = {
  size: "1024x1024",
  quality: "low",
  background: "transparent",
  output_format: "webp",
  output_compression: 60,
};

/** 100만 토큰당 가격(USD), gpt-image-2.5-flare 기준이라 모델을 바꾸면 추정 비용도 맞지 않음 */
const PRICE_PER_MILLION = { text: 5, image: 8, output: 30 };

interface ImageUsage {
  input_tokens: number;
  output_tokens: number;
  input_tokens_details?: { text_tokens?: number; image_tokens?: number };
}

interface ImageResponse {
  data: { b64_json: string }[];
  usage?: ImageUsage;
}

interface OpenAIErrorResponse {
  error?: { code?: string; message?: string };
}

export const isGridSize = (value: unknown): value is GridSize =>
  Object.values(GRID_SIZE).includes(value as GridSize);

/**
 * OpenAI 이미지 API를 호출하고 결과를 그대로 클라이언트에 돌려줄 Response로 만듦
 * - 성공: { image: data URL }
 * - 부적절한 요청으로 거절: 422
 * - 그 외 실패: 502
 */
export const requestOpenAIImage = async (
  endpoint: "generations" | "edits",
  params: { prompt: string; image?: Blob },
): Promise<Response> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY가 설정되지 않았습니다.");
    return Response.json({ message: "AI 기능을 사용할 수 없습니다." }, { status: 500 });
  }

  // 이미지 편집(edits)은 원본 이미지를 파일로 보내야 해서 multipart로 요청
  const fields = { model: MODEL, prompt: params.prompt, ...OUTPUT_OPTIONS };
  const body = endpoint === "edits" ? toFormData(fields, params.image) : JSON.stringify(fields);

  try {
    const response = await fetch(`${OPENAI_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(typeof body === "string" && { "Content-Type": "application/json" }),
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      const { error }: OpenAIErrorResponse = await response.json().catch(() => ({}));
      console.error(`OpenAI image ${endpoint} error:`, response.status, error);
      // 부적절한 내용은 OpenAI 안전 정책에 의해 거절됨
      if (error?.code === "moderation_blocked") {
        return Response.json({ message: "이 내용으로는 이미지를 만들 수 없습니다." }, { status: 422 });
      }
      return Response.json({ message: "이미지를 만들지 못했습니다." }, { status: 502 });
    }

    const { data, usage }: ImageResponse = await response.json();
    if (usage) logUsage(endpoint, usage);
    return Response.json({ image: `data:image/webp;base64,${data[0].b64_json}` });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "이미지를 만들지 못했습니다." }, { status: 502 });
  }
};

// 요청마다 비용이 들쭉날쭉해서 입력(텍스트·이미지)과 출력 중 어디서 토큰이 늘어나는지 확인하려고 남김
const logUsage = (endpoint: string, { input_tokens, output_tokens, input_tokens_details }: ImageUsage) => {
  const textTokens = input_tokens_details?.text_tokens ?? input_tokens;
  const imageTokens = input_tokens_details?.image_tokens ?? 0;
  const cost =
    (textTokens * PRICE_PER_MILLION.text +
      imageTokens * PRICE_PER_MILLION.image +
      output_tokens * PRICE_PER_MILLION.output) /
    1_000_000;

  console.info(
    `OpenAI image ${endpoint} usage: text ${textTokens}, image ${imageTokens}, output ${output_tokens} tokens (~$${cost.toFixed(4)})`,
  );
};

const toFormData =(fields: Record<string, string | number>, image?: Blob) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, String(value)));
  if (image) form.append("image", image, "drawing.png");
  return form;
};
