import { DRAFT_KEYWORD_MAX_LENGTH } from "@/constants";
import { runWithAIQuota } from "@/server/rateLimit";
import { GRID_SIZE, type GridSize } from "@/types";
import { isGridSize, requestOpenAIImage } from "../_lib/openaiImage";
import { readJsonBody } from "../_lib/readJsonBody";

/** 키워드 50자를 모두 \u 이스케이프로 보내도(약 300바이트) 남는 크기 */
const MAX_BODY_BYTES = 2 * 1024;

// 키워드가 한국어라 영어 뜻으로 오해하지 않도록 안내 (예: "치킨"을 살아 있는 닭으로 그림)
const KOREAN_NOTE = `The subject is written in Korean; interpret it the way a Korean speaker would (e.g. "치킨" means fried chicken).`;

// 캔버스 크기에 맞춰 그리게 해야 픽셀로 줄였을 때 형태가 살아남음
// 16×16은 세부 묘사가 모두 뭉개지므로 처음부터 16칸짜리 단순한 스프라이트로 요청
// 32×32도 격자를 정해 주지 않으면 큼직한 블록으로 그려서 줄였을 때 16칸 그림처럼 보이므로 32칸 격자로 요청
const PROMPTS: Record<GridSize, (keyword: string) => string> = {
  [GRID_SIZE.SMALL]: (keyword) =>
    `A tiny 16x16 pixel art sprite of "${keyword}", drawn on a 16 by 16 grid where every pixel is a huge square block.
Cute and extremely simple: a bold silhouette, a 1-pixel dark outline, 3 to 5 flat colors, only the most essential features (e.g. two dot eyes). No anti-aliasing, no gradients, no small details.
One subject centered and filling the whole grid. Transparent background, no text, no shadow.
${KOREAN_NOTE}`,
  [GRID_SIZE.LARGE]: (keyword) =>
    `A cute 32x32 pixel art sprite of "${keyword}", drawn on a 32 by 32 grid where every pixel is a large square block.
Use the full 32x32 resolution: a 1-pixel dark outline, clear recognizable features and a few simple details, 5 to 8 flat colors. No anti-aliasing, no gradients.
One subject centered and filling the whole grid, facing the viewer. Transparent background, no text, no shadow, no border.
${KOREAN_NOTE}`,
};

export async function POST(request: Request) {
  const parsed = await readJsonBody(request, MAX_BODY_BYTES);
  if ("error" in parsed) return parsed.error;
  const body = parsed.body as { keyword?: unknown; size?: unknown } | null;
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

  return runWithAIQuota("draft", request, () =>
    requestOpenAIImage("generations", { prompt: PROMPTS[size](keyword) }),
  );
}
