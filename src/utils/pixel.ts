import type { GridSize, Pixels } from "@/types";

export interface Cell {
  x: number;
  y: number;
}

export const createEmptyPixels = (size: GridSize): Pixels => Array(size * size).fill(null);

export const isEmptyPixels = (pixels: Pixels) => pixels.every((pixel) => pixel === null);

/** start 칸과 상하좌우로 이어진 같은 색(빈칸 포함) 칸 목록 */
export const getFillIndices = (pixels: Pixels, size: GridSize, start: number): number[] => {
  const target = pixels[start];
  const visited = new Set([start]);
  const queue = [start];

  for (let i = 0; i < queue.length; i++) {
    const index = queue[i];
    const x = index % size;
    // 행 끝에서 다음 행 첫 칸으로 넘어가지 않도록 좌우는 x 경계를 확인
    const neighbors = [x > 0 ? index - 1 : -1, x < size - 1 ? index + 1 : -1, index - size, index + size];
    neighbors.forEach((next) => {
      if (next < 0 || next >= pixels.length || visited.has(next) || pixels[next] !== target) return;
      visited.add(next);
      queue.push(next);
    });
  }

  return queue;
};

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
