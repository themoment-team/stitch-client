import type { Drawing, Pixels } from "@/types";
import { drawingToPngDataUrl, imageToPixels } from "@/utils";
import { readImageResponse } from "./imageResponse";

/** 사용자가 그린 그림을 AI가 같은 크기의 픽셀 그림으로 다듬어 반환 */
export const convertDrawing = async (drawing: Drawing): Promise<Pixels> => {
  const response = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: drawingToPngDataUrl(drawing), size: drawing.size }),
  });

  return imageToPixels(await readImageResponse(response), drawing.size);
};
