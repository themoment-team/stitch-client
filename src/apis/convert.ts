import type { Drawing, Pixels } from "@/types";
import { drawingToPngDataUrl, imageToPixels } from "@/utils";
import { readImageResponse } from "./imageResponse";

/**
 * 투명한 칸은 실제 색 값이 검정(0,0,0)이라 AI가 검은색으로 읽음
 * → 색을 채우지 않은 흰 토끼가 검은 토끼로 바뀌므로 흰 배경을 깔아서 보냄
 */
const AI_INPUT_BACKGROUND = "#ffffff";

/** 사용자가 그린 그림을 AI가 같은 크기의 픽셀 그림으로 다듬어 반환 */
export const convertDrawing = async (drawing: Drawing): Promise<Pixels> => {
  const response = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: drawingToPngDataUrl(drawing, AI_INPUT_BACKGROUND), size: drawing.size }),
  });

  return imageToPixels(await readImageResponse(response), drawing.size);
};
