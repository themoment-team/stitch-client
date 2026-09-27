import { insertDrawing, isValidDrawing } from "@/server/drawingStore";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidDrawing(body)) {
    return Response.json({ message: "그림이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const id = await insertDrawing(body);
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "그림을 저장하지 못했습니다." }, { status: 500 });
  }
}
