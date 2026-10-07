import { runWithAIQuota } from "@/server/rateLimit";
import { GRID_SIZE, type GridSize } from "@/types";
import { isGridSize, requestOpenAIImage } from "../_lib/openaiImage";
import { payloadTooLarge, readJsonBody } from "../_lib/readJsonBody";

const PNG_DATA_URL_PREFIX = "data:image/png;base64,";
/** 512px로 키운 픽셀 그림은 수십 KB라 넉넉히 잡아도 1MB면 충분 */
const MAX_IMAGE_BYTES = 1024 * 1024;
/** MAX_IMAGE_BYTES를 base64로 바꾼 길이. 디코딩하기 전에 문자열 길이로 먼저 거름 */
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;
/** 이미지(data URL)와 캔버스 크기를 담은 JSON 본문의 최대 크기 */
const MAX_BODY_BYTES = PNG_DATA_URL_PREFIX.length + MAX_BASE64_LENGTH + 1024;

/** AI 결과 이미지 한 변의 길이(openaiImage의 size와 같음), 한 칸이 몇 px인지 알려줄 때 사용 */
const OUTPUT_IMAGE_SIZE = 1024;

// 형태를 그대로 두고 다듬게 하면 윤곽선만 덧붙이고 끝나므로,
// 그림을 스케치로 보고 무엇을 그리려 했는지 파악해 완성된 그림으로 다시 그리도록 요청
// (미완성 그림은 형태를 보완해 완성하고, 이미 완성된 그림은 더 높은 퀄리티로 끌어올림)
// 16×16은 세부 묘사가 뭉개지므로 단순하게, 32×32는 명암까지 넣도록 크기별로 스타일을 나눔
const STYLE: Record<GridSize, string> = {
  [GRID_SIZE.SMALL]: "Very simple: bold silhouette, 3 to 6 colors, only essential features (e.g. dot eyes).",
  [GRID_SIZE.LARGE]: "16-bit style: clear features, simple highlight and shadow, 6 to 12 colors.",
};

// 결과는 imageToPixels에서 칸마다 대표 색 하나로 줄이므로
// 여백 없이 캔버스 전체를 같은 격자로 채우고, 칸 경계에 맞춰 그려야 형태가 어긋나지 않음
const buildPrompt = (size: GridSize) =>
  `This is a user's rough ${size}x${size} pixel drawing on a white background. Figure out what they meant to draw and redraw it as a finished, cute, high-quality ${size}x${size} pixel art sticker.
- If it is rough or incomplete, fix the proportions and add missing parts (eyes, ears, legs...). Do not just trace it or add an outline around it.
- If it is already finished, keep the design and raise the quality.
- Keep the subject, pose and main colors; shape, size and position may change. No unrelated objects or text.
- White outside the subject is background; white inside it (e.g. a white rabbit) stays white.
- ${STYLE[size]} Dark outline, subject centered and filling most of the grid.
- The grid fills the whole image with no margin: each pixel is a ${OUTPUT_IMAGE_SIZE / size}px square block of one flat color. No anti-aliasing or gradients. Transparent background, no shadow.`;

export async function POST(request: Request) {
  const parsed = await readJsonBody(request, MAX_BODY_BYTES);
  if ("error" in parsed) return parsed.error;
  const body = parsed.body as { image?: unknown; size?: unknown } | null;
  const image = typeof body?.image === "string" ? body.image : "";
  const size = body?.size;

  if (!image.startsWith(PNG_DATA_URL_PREFIX)) {
    return Response.json({ message: "그림 이미지가 올바르지 않습니다." }, { status: 400 });
  }
  if (!isGridSize(size)) {
    return Response.json({ message: "캔버스 크기가 올바르지 않습니다." }, { status: 400 });
  }

  const base64 = image.slice(PNG_DATA_URL_PREFIX.length);
  if (base64.length > MAX_BASE64_LENGTH) return payloadTooLarge();

  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    return Response.json({ message: "그림 이미지가 너무 큽니다." }, { status: 413 });
  }

  return runWithAIQuota("convert", request, () =>
    requestOpenAIImage("edits", {
      prompt: buildPrompt(size),
      image: new Blob([buffer], { type: "image/png" }),
    }),
  );
}
