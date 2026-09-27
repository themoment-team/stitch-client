import type { Drawing } from "@/types";

/** 칸 경계가 또렷하게 보이도록 칸을 크게 키워 만들 이미지 크기 (16·32 모두 정수 배율) */
const EXPORT_SIZE = 512;

/**
 * 픽셀 그림을 PNG data URL로 변환 (칸 경계가 번지지 않게 정수 배율로 키움)
 * 배경색을 주지 않으면 빈 칸은 투명하게 둠
 */
export const drawingToPngDataUrl = ({ size, pixels }: Drawing, background?: string): string => {
  const cellSize = EXPORT_SIZE / size;
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("캔버스를 사용할 수 없습니다.");

  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
  }
  pixels.forEach((color, index) => {
    if (!color) return;
    context.fillStyle = color;
    context.fillRect((index % size) * cellSize, Math.floor(index / size) * cellSize, cellSize, cellSize);
  });

  return canvas.toDataURL("image/png");
};
