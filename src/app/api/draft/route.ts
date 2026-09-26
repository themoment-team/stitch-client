import { DRAFT_KEYWORD_MAX_LENGTH } from "@/constants";
import { GRID_SIZE, type GridSize } from "@/types";

const OPENAI_URL = "https://api.openai.com/v1/images/generations";
const MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

// 캔버스 크기에 맞춰 그리게 해야 픽셀로 줄였을 때 형태가 살아남음
// 16×16은 세부 묘사가 모두 뭉개지므로 처음부터 16칸짜리 단순한 스프라이트로 요청
// 키워드는 한국어라 영어 뜻으로 오해하지 않도록 안내 (예: "치킨"을 살아 있는 닭으로 그림)
const KEYWORD_NOTE = `The subject is written in Korean; interpret it the way a Korean speaker would (e.g. "치킨" means fried chicken).`;

const PROMPTS: Record<GridSize, (keyword: string) => string> = {
  [GRID_SIZE.SMALL]: (keyword) =>
    `A tiny 16x16 pixel art sprite of "${keyword}", drawn on a 16 by 16 grid where every pixel is a huge square block.
Cute and extremely simple: a bold silhouette, a 1-pixel dark outline, 3 to 5 flat colors, only the most essential features (e.g. two dot eyes). No anti-aliasing, no gradients, no small details.
One subject centered and filling the whole grid. Transparent background, no text, no shadow.
${KEYWORD_NOTE}`,
  [GRID_SIZE.LARGE]: (keyword) =>
    `A cute kawaii sticker of "${keyword}" in simple 16-bit pixel art style.
Big chunky pixels, bold dark outline, flat bright colors, very few details, one subject centered and filling most of the frame, facing the viewer.
Transparent background, no text, no shadow, no border.
${KEYWORD_NOTE}`,
};

interface ImageGenerationResponse {
  data: { b64_json: string }[];
}

interface OpenAIErrorResponse {
  error?: { code?: string; message?: string };
}

const isGridSize = (value: unknown): value is GridSize =>
  Object.values(GRID_SIZE).includes(value as GridSize);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";
  const size = body?.size;

  if (!keyword || keyword.length > DRAFT_KEYWORD_MAX_LENGTH) {
    return Response.json(
      { message: `키워드는 1~${DRAFT_KEYWORD_MAX_LENGTH}자로 입력해주세요.` },
      { status: 400 },
    );
  }
  if (!isGridSize(size)) {
    return Response.json({ message: "캔버스 크기가 올바르지 않습니다." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY가 설정되지 않았습니다.");
    return Response.json({ message: "AI 도안 기능을 사용할 수 없습니다." }, { status: 500 });
  }

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: PROMPTS[size](keyword),
        size: "1024x1024",
        // 어차피 16·32칸으로 줄이므로 가장 빠르고 저렴한 품질로 충분
        quality: "low",
        background: "transparent",
        // png는 1.7MB 정도라 투명 배경을 유지하면서 훨씬 가벼운 webp(약 100KB)로 받음
        output_format: "webp",
        output_compression: 60,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const { error }: OpenAIErrorResponse = await response.json().catch(() => ({}));
      console.error("OpenAI image error:", response.status, error);
      // 부적절한 키워드는 OpenAI 안전 정책에 의해 거절됨
      if (error?.code === "moderation_blocked") {
        return Response.json({ message: "이 키워드로는 도안을 만들 수 없습니다." }, { status: 422 });
      }
      return Response.json({ message: "도안을 만들지 못했습니다." }, { status: 502 });
    }

    const { data }: ImageGenerationResponse = await response.json();
    return Response.json({ image: `data:image/webp;base64,${data[0].b64_json}` });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "도안을 만들지 못했습니다." }, { status: 502 });
  }
}
