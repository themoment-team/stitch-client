import type { BoardDrawing, Drawing } from "@/types";
import { RateLimitError } from "./errors";

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
  if (response.status === 429) throw new RateLimitError();
  if (!response.ok) throw new Error(`그림 저장 실패: ${response.status}`);

  const { id }: SaveDrawingResponse = await response.json();
  return id;
};

interface FetchDrawingsResponse {
  drawings: BoardDrawing[];
}

/** 보드에 띄울 그림 중 after(ISO 시각) 이후에 저장된 그림을 새것부터 받아옴 */
export const fetchNewDrawings = async (after?: string): Promise<BoardDrawing[]> => {
  const query = after ? `?${new URLSearchParams({ after })}` : "";
  const response = await fetch(`/api/drawings${query}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`그림 조회 실패: ${response.status}`);

  const { drawings }: FetchDrawingsResponse = await response.json();
  return drawings;
};
