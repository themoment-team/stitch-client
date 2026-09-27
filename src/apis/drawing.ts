import type { Drawing } from "@/types";

interface SaveDrawingResponse {
  id: string;
}

/** 최종 그림을 DB에 저장하고, 다운로드 페이지 주소에 쓸 id를 반환 */
export const saveDrawing = async (drawing: Drawing): Promise<string> => {
  const response = await fetch("/api/drawings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(drawing),
  });
  if (!response.ok) throw new Error(`그림 저장 실패: ${response.status}`);

  const { id }: SaveDrawingResponse = await response.json();
  return id;
};
