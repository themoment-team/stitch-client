import type { Drawing } from "@/types";

/** AI가 픽셀 경계를 알아보기 쉽도록 칸을 크게 키워 보낼 이미지 크기 */
const EXPORT_SIZE = 512;

/** 픽셀 그림을 투명 배경의 PNG data URL로 변환 (칸 경계가 번지지 않게 정수 배율로 키움) */
export const drawingToPngDataUrl = ({ size, pixels }: Drawing): string => {
  const cellSize = EXPORT_SIZE / size;
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("캔버스를 사용할 수 없습니다.");

  pixels.forEach((color, index) => {
    if (!color) return;
    context.fillStyle = color;
    context.fillRect((index % size) * cellSize, Math.floor(index / size) * cellSize, cellSize, cellSize);
  });

  return canvas.toDataURL("image/png");
};
