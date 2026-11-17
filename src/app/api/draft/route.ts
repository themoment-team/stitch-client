import { DRAFT_KEYWORD_MAX_LENGTH } from "@/constants";
import { consumeQuota, tooManyRequests } from "@/server/rateLimit";
import type { GridSize } from "@/types";
import { isGridSize, requestOpenAIImage } from "../_lib/openaiImage";
import { readJsonBody } from "../_lib/readJsonBody";

/** 키워드 50자를 모두 \u 이스케이프로 보내도(약 300바이트) 남는 크기 */
const MAX_BODY_BYTES = 2 * 1024;

// 키워드가 한국어라 영어 뜻으로 오해하지 않도록 안내 (예: "치킨"을 살아 있는 닭으로 그림)
const KOREAN_NOTE = `The subject is written in Korean; interpret it the way a Korean speaker would (e.g. "치킨" means fried chicken).`;

// 캔버스 크기에 맞춰 그리게 해야 픽셀로 줄였을 때 형태가 살아남음
// 캔버스 크기에 맞춰 그리게 해야 픽셀로 줄였을 때 형태가 살아남음
// 20칸 이하는 세부 묘사가 모두 뭉개지므로 처음부터 단순한 스프라이트로 요청하고,
// 그보다 크면 격자를 정해 주지 않을 때 큼직한 블록으로 그려 줄였을 때 작은 그림처럼 보이므로 캔버스 크기의 격자로 요청
const buildPrompt = (keyword: string, size: GridSize) => {
  const grid = `${size}x${size}`;
  if (size <= 20) {
    return `A tiny ${grid} pixel art sprite of "${keyword}", drawn on a ${size} by ${size} grid where every pixel is a huge square block.
Cute and extremely simple: a bold silhouette, a 1-pixel dark outline, 3 to 5 flat colors, only the most essential features (e.g. two dot eyes). No anti-aliasing, no gradients, no small details.
One subject centered and filling the whole grid. Transparent background, no text, no shadow.
${KOREAN_NOTE}`;
  }
  const detail =
    size <= 40
      ? "clear recognizable features and a few simple details, 5 to 8 flat colors"
      : "detailed features, simple shading with a few tones per color, 8 to 16 flat colors";
  return `A cute ${grid} pixel art sprite of "${keyword}", drawn on a ${size} by ${size} grid where every pixel is a square block.
Use the full ${grid} resolution: a 1-pixel dark outline, ${detail}. No anti-aliasing, no gradients.
One subject centered and filling the whole grid, facing the viewer. Transparent background, no text, no shadow, no border.
${KOREAN_NOTE}`;
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

  if (!(await consumeQuota("ai", request))) return tooManyRequests();

  return requestOpenAIImage("generations", { prompt: buildPrompt(keyword, size) });
}
