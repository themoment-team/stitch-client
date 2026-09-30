import { consumeQuota, tooManyRequests } from "@/server/rateLimit";
import { GRID_SIZE, type GridSize } from "@/types";
import { isGridSize, requestOpenAIImage } from "../_lib/openaiImage";

const PNG_DATA_URL_PREFIX = "data:image/png;base64,";
/** 512px로 키운 픽셀 그림은 수십 KB라 넉넉히 잡아도 1MB면 충분 */
const MAX_IMAGE_BYTES = 1024 * 1024;

/** AI 결과 이미지 한 변의 길이(openaiImage의 size와 같음), 한 칸이 몇 px인지 알려줄 때 사용 */
const OUTPUT_IMAGE_SIZE = 1024;

// 형태를 그대로 두고 다듬게 하면 윤곽선만 덧붙이고 끝나므로,
// 그림을 스케치로 보고 무엇을 그리려 했는지 파악해 완성된 그림으로 다시 그리도록 요청
// (미완성 그림은 형태를 보완해 완성하고, 이미 완성된 그림은 더 높은 퀄리티로 끌어올림)
// 16×16은 세부 묘사가 뭉개지므로 단순하게, 32×32는 명암까지 넣도록 크기별로 스타일을 나눔
const STYLE: Record<GridSize, string> = {
  [GRID_SIZE.SMALL]:
    "Tiny sprite style: a bold, instantly readable silhouette, 3 to 6 colors, only the most essential features (e.g. two dot eyes). At most one shade per color.",
  [GRID_SIZE.LARGE]:
    "16-bit sprite style: clear shapes, readable facial features, simple shading with one highlight and one shadow tone per color, about 6 to 12 colors.",
};

// 결과는 imageToPixels에서 칸마다 대표 색 하나로 줄이므로
// 여백 없이 캔버스 전체를 같은 격자로 채우고, 칸 경계에 맞춰 그려야 형태가 어긋나지 않음
const buildPrompt = (size: GridSize) => {
  const cell = OUTPUT_IMAGE_SIZE / size;
  return `The input image is a user's ${size}x${size} pixel drawing. Treat it as a rough sketch and redraw it as a finished, high-quality, cute ${size}x${size} pixel art sticker.

INPUT: The drawing is scaled up and drawn on a plain white background.
- White area connected to the edges of the image, outside the subject, is empty background.
- White areas enclosed by the subject (e.g. a white rabbit's body, the white of an eye) are part of the subject and must stay white, never black, dark or transparent.

STEP 1 - UNDERSTAND: Figure out what the user was trying to draw (the subject, its pose or orientation, and its main colors).

STEP 2 - REDRAW based on how finished the drawing is:
- If it is rough, messy or incomplete (scribbled shapes, wrong proportions, missing parts such as eyes, ears, legs or a tail): complete it. Rebuild the shapes with proper proportions, fill in the missing parts the subject obviously needs, and turn it into a polished pixel art character or object. Do not just trace the original shape or add an outline around it.
- If it is already a clean, finished drawing: keep its design and upgrade the quality with cleaner lines, better proportions, clearer features and nicer shading.

KEEP: The same subject, overall pose or orientation, and main colors, so the user recognizes it as their idea. You may freely reshape, resize and re-center it to look good. Do not turn it into a different subject and do not add unrelated objects, backgrounds or text.

STYLE: ${STYLE[size]} A clean dark outline that follows the new shape. Subject centered and filling most of the grid, facing the viewer when natural.

OUTPUT FORMAT (strict):
- Exactly a ${size} by ${size} grid covering the entire ${OUTPUT_IMAGE_SIZE}x${OUTPUT_IMAGE_SIZE} image, with no margin: every pixel is a solid square block of exactly ${cell}x${cell} image pixels, aligned to the image edges.
- One flat color per block. No anti-aliasing, gradients, dithering, blur, noise or sub-block details.
- Transparent background. No text, shadow, border, frame or sticker white edge.`;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const image = typeof body?.image === "string" ? body.image : "";
  const size = body?.size;

  if (!image.startsWith(PNG_DATA_URL_PREFIX)) {
    return Response.json({ message: "그림 이미지가 올바르지 않습니다." }, { status: 400 });
  }
  if (!isGridSize(size)) {
    return Response.json({ message: "캔버스 크기가 올바르지 않습니다." }, { status: 400 });
  }

  const buffer = Buffer.from(image.slice(PNG_DATA_URL_PREFIX.length), "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    return Response.json({ message: "그림 이미지가 너무 큽니다." }, { status: 413 });
  }

  if (!(await consumeQuota("ai", request))) return tooManyRequests();

  return requestOpenAIImage("edits", {
    prompt: buildPrompt(size),
    image: new Blob([buffer], { type: "image/png" }),
  });
}
