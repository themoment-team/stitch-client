import { isGridSize, requestOpenAIImage } from "../_lib/openaiImage";

const PNG_DATA_URL_PREFIX = "data:image/png;base64,";
/** 512px로 키운 픽셀 그림은 수십 KB라 넉넉히 잡아도 1MB면 충분 */
const MAX_IMAGE_BYTES = 1024 * 1024;

// 사용자가 그린 그림을 알아볼 수 있게 구도·색은 유지하고 다듬기만 하도록 요청
const buildPrompt = (size: number) =>
  `Refine this ${size}x${size} pixel art drawing into a cleaner, cuter ${size}x${size} pixel art sticker.
Keep the same subject, composition, pose and main colors so it is clearly the same drawing.
Clean up stray or uneven pixels, make shapes symmetric where natural, add a consistent 1-pixel dark outline, keep flat colors with no gradients or anti-aliasing.
Every pixel is a huge square block on a ${size} by ${size} grid. Transparent background, no text, no shadow.`;

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

  return requestOpenAIImage("edits", {
    prompt: buildPrompt(size),
    image: new Blob([buffer], { type: "image/png" }),
  });
}
