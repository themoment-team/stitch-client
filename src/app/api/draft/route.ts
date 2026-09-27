import { DRAFT_KEYWORD_MAX_LENGTH } from "@/constants";
import { GRID_SIZE, type GridSize } from "@/types";
import { isGridSize, requestOpenAIImage } from "../_lib/openaiImage";

// 키워드가 한국어라 영어 뜻으로 오해하지 않도록 안내 (예: "치킨"을 살아 있는 닭으로 그림)
const KOREAN_NOTE = `The subject is written in Korean; interpret it the way a Korean speaker would (e.g. "치킨" means fried chicken).`;

// 캔버스 크기에 맞춰 그리게 해야 픽셀로 줄였을 때 형태가 살아남음
// 16×16은 세부 묘사가 모두 뭉개지므로 처음부터 16칸짜리 단순한 스프라이트로 요청
const PROMPTS: Record<GridSize, (keyword: string) => string> = {
  [GRID_SIZE.SMALL]: (keyword) =>
    `A tiny 16x16 pixel art sprite of "${keyword}", drawn on a 16 by 16 grid where every pixel is a huge square block.
Cute and extremely simple: a bold silhouette, a 1-pixel dark outline, 3 to 5 flat colors, only the most essential features (e.g. two dot eyes). No anti-aliasing, no gradients, no small details.
One subject centered and filling the whole grid. Transparent background, no text, no shadow.
${KOREAN_NOTE}`,
  [GRID_SIZE.LARGE]: (keyword) =>
    `A cute kawaii sticker of "${keyword}" in simple 16-bit pixel art style.
Big chunky pixels, bold dark outline, flat bright colors, very few details, one subject centered and filling most of the frame, facing the viewer.
Transparent background, no text, no shadow, no border.
${KOREAN_NOTE}`,
};

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

  return requestOpenAIImage("generations", { prompt: PROMPTS[size](keyword) });
}
