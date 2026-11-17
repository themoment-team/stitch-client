import { IMAGE_URL_MAX_LENGTH } from "@/constants";
import { consumeQuota, tooManyRequests } from "@/server/rateLimit";
import { fetchRemoteImage, RemoteImageError } from "@/server/remoteImage";
import { readJsonBody } from "../_lib/readJsonBody";

/** 주소 하나를 모두 \u 이스케이프로 보내도 남는 크기 */
const MAX_BODY_BYTES = IMAGE_URL_MAX_LENGTH * 6 + 1024;

/**
 * 구글 이미지 검색 창에서 끌어다 놓은 이미지를 대신 받아옴
 * 다른 사이트의 이미지는 CORS 때문에 브라우저가 캔버스에서 픽셀을 읽을 수 없으므로 서버를 거쳐 같은 출처로 내려줌
 */
export async function POST(request: Request) {
  const parsed = await readJsonBody(request, MAX_BODY_BYTES);
  if ("error" in parsed) return parsed.error;
  const body = parsed.body as { url?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url || url.length > IMAGE_URL_MAX_LENGTH) {
    return Response.json({ message: "이미지 주소가 올바르지 않습니다." }, { status: 400 });
  }

  if (!(await consumeQuota("image", request))) return tooManyRequests();

  try {
    const { type, body: image } = await fetchRemoteImage(url);
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": type,
        // 받아온 내용을 브라우저가 형식을 추측해 HTML 등으로 열지 않도록 함
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof RemoteImageError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ message: "이미지를 받아오지 못했습니다." }, { status: 502 });
  }
}
