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

/**
 * 서로 이만큼 가까운 색(RGB 거리)은 같은 색으로 보고 하나만 남김
 * AI 도안은 칸마다 평균 색을 쓰므로 경계 칸에서 눈으로는 구분되지 않는 비슷한 색이 여러 개 생김
 */
const SIMILAR_COLOR_DISTANCE = 24;

const hexToRgb = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

const isSimilarColor = (a: string, b: string) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2) < SIMILAR_COLOR_DISTANCE;
};

/** 그림에 쓰인 색을 많이 쓰인 순서로 최대 limit개 반환. 비슷한 색은 더 많이 쓰인 하나만 남김 */
export const getMainColors = (pixels: Pixels, limit: number): string[] => {
  const counts = new Map<string, number>();
  pixels.forEach((color) => {
    if (!color) return;
    const key = color.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const colors: string[] = [];
  for (const [color] of [...counts].sort((a, b) => b[1] - a[1])) {
    if (colors.length >= limit) break;
    if (!colors.some((picked) => isSimilarColor(picked, color))) colors.push(color);
  }
  return colors;
};
