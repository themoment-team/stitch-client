import type { GridSize, Pixels } from "@/types";

export interface Cell {
  x: number;
  y: number;
}

export const createEmptyPixels = (size: GridSize): Pixels => Array(size * size).fill(null);

export const isEmptyPixels = (pixels: Pixels) => pixels.every((pixel) => pixel === null);

/** 두 칸 사이를 빈틈없이 잇는 칸 목록 (브레젠험 알고리즘) */
export const getLineCells = (from: Cell, to: Cell): Cell[] => {
  const cells: Cell[] = [];
  const dx = Math.abs(to.x - from.x);
  const dy = -Math.abs(to.y - from.y);
  const stepX = from.x < to.x ? 1 : -1;
  const stepY = from.y < to.y ? 1 : -1;
  let error = dx + dy;
  let { x, y } = from;

  while (true) {
    cells.push({ x, y });
    if (x === to.x && y === to.y) break;
    const doubled = error * 2;
    if (doubled >= dy) {
      error += dy;
      x += stepX;
    }
    if (doubled <= dx) {
      error += dx;
      y += stepY;
    }
  }

  return cells;
};
