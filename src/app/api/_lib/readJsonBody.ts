/**
 * Route Handler에는 Next.js 자체 본문 크기 제한이 없고, Vercel의 상한(4.5MB)은 이 API들에 필요한 크기보다 훨씬 큼
 * 그래서 본문을 파싱하기 전에 정해진 바이트까지만 읽고, 넘으면 더 읽지 않고 413으로 거절함
 */
export const payloadTooLarge = () =>
  Response.json({ message: "요청이 너무 큽니다." }, { status: 413 });

/**
 * 요청 본문을 최대 maxBytes까지만 읽어 JSON으로 파싱
 * - Content-Length가 상한을 넘으면 읽지 않고 바로 거절
 * - Content-Length는 조작하거나 생략할 수 있으므로 실제로 읽은 바이트 수도 세서, 넘는 순간 읽기를 멈춤
 * - 상한 안이지만 JSON이 아니면 body를 null로 돌려줘 각 API의 입력값 검사에서 400으로 처리
 */
export const readJsonBody = async (
  request: Request,
  maxBytes: number,
): Promise<{ body: unknown } | { error: Response }> => {
  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > maxBytes) return { error: payloadTooLarge() };
  if (!request.body) return { body: null };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    if (receivedBytes > maxBytes) {
      await reader.cancel().catch(() => {});
      return { error: payloadTooLarge() };
    }
    chunks.push(value);
  }

  try {
    return { body: JSON.parse(Buffer.concat(chunks).toString("utf8")) };
  } catch {
    return { body: null };
  }
};
