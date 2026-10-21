import { findRecentDrawings, insertDrawing, isValidDrawing } from "@/server/drawingStore";
import { consumeQuota, tooManyRequests } from "@/server/rateLimit";
import { readJsonBody } from "../_lib/readJsonBody";

/** 32×32 그림의 칸 1,024개가 모두 색(약 10바이트)이어도 약 10KB라 넉넉히 잡음 */
const MAX_BODY_BYTES = 32 * 1024;

/** 보드가 주기적으로 호출해 새로 저장된 그림을 받아감. ?after=ISO 시각을 주면 그 이후 그림만 반환 */
export async function GET(request: Request) {
  const afterParam = new URL(request.url).searchParams.get("after");
  const after = afterParam === null ? undefined : Date.parse(afterParam);
  if (Number.isNaN(after)) {
    return Response.json({ message: "after 값이 올바른 시각이 아닙니다." }, { status: 400 });
  }

  try {
    const drawings = await findRecentDrawings(after);
    return Response.json({ drawings });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "그림을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const parsed = await readJsonBody(request, MAX_BODY_BYTES);
  if ("error" in parsed) return parsed.error;
  const { body } = parsed;
  if (!isValidDrawing(body)) {
    return Response.json({ message: "그림이 올바르지 않습니다." }, { status: 400 });
  }

  if (!(await consumeQuota("drawings", request))) return tooManyRequests();

  try {
    const id = await insertDrawing(body);
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "그림을 저장하지 못했습니다." }, { status: 500 });
  }
}
