import { GRID_SIZE, type GridSize } from "@/types";

const OPENAI_URL = "https://api.openai.com/v1/images";
const MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
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

interface ImageResponse {
  data: { b64_json: string }[];
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

    const { data }: ImageResponse = await response.json();
    return Response.json({ image: `data:image/webp;base64,${data[0].b64_json}` });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "이미지를 만들지 못했습니다." }, { status: 502 });
  }
};

const toFormData = (fields: Record<string, string | number>, image?: Blob) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, String(value)));
  if (image) form.append("image", image, "drawing.png");
  return form;
};
