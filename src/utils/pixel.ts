import type { GridSize, Pixels } from "@/types";
import { colorDistance, hexToRgb, type RGB } from "./color";

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
 * 서로 이만큼 가까운 색은 같은 색으로 보고 하나만 남김
 * AI 도안·이미지 변환은 칸마다 평균 색을 쓰므로 경계 칸에서 눈으로는 구분되지 않는 비슷한 색이 여러 개 생김
 */
const SIMILAR_COLOR_DISTANCE = 24;
/** 고를 색 중 이 비율만큼은 많이 쓰인 순서로 채우고, 나머지는 이미 고른 색과 가장 다른 색부터 채움 */
const FREQUENT_COLOR_RATIO = 2 / 3;

interface ColorEntry {
  color: string;
  rgb: RGB | null;
}

const isSimilarColor = (a: ColorEntry, b: ColorEntry) =>
  // 형식을 알 수 없는 색은 비교할 수 없으므로 다른 색으로 봄
  a.rgb !== null && b.rgb !== null && colorDistance(a.rgb, b.rgb) < SIMILAR_COLOR_DISTANCE;

/** 이미 고른 색들과 가장 가까운 거리. 클수록 고른 색들과 다른 색 */
const distanceToPicked = (entry: ColorEntry, picked: ColorEntry[]) =>
  entry.rgb === null
    ? Infinity
    : Math.min(...picked.map(({ rgb }) => (rgb === null ? Infinity : colorDistance(entry.rgb!, rgb))));

/**
 * 그림에 쓰인 주요 색을 최대 limit개 반환
 * - 색이 limit개 이하면(준비된 도안처럼 사람이 일부러 나눠 쓴 색) 비슷해도 합치지 않고 모두 많이 쓰인 순서로 반환
 * - 그보다 많으면(AI 도안·이미지 변환) 비슷한 색은 더 많이 쓰인 하나만 남기고,
 *   앞쪽은 많이 쓰인 색으로, 남은 칸은 눈·볼처럼 적게 쓰여도 눈에 띄는 색이 밀려나지 않게 고른 색과 가장 다른 색부터 채움
 */
export const getMainColors = (pixels: Pixels, limit: number): string[] => {
  const counts = new Map<string, number>();
  pixels.forEach((color) => {
    if (!color) return;
    const key = color.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const byUsage = [...counts].sort((a, b) => b[1] - a[1]).map(([color]) => color);
  if (byUsage.length <= limit) return byUsage;

  const distinct = byUsage
    .map((color): ColorEntry => ({ color, rgb: hexToRgb(color) }))
    .reduce<ColorEntry[]>(
      (kept, entry) => (kept.some((other) => isSimilarColor(other, entry)) ? kept : [...kept, entry]),
      [],
    );
  if (distinct.length <= limit) return distinct.map(({ color }) => color);

  const picked = distinct.slice(0, Math.ceil(limit * FREQUENT_COLOR_RATIO));
  const rest = distinct.slice(picked.length);
  while (picked.length < limit) {
    const farthest = rest.reduce((best, entry) =>
      distanceToPicked(entry, picked) > distanceToPicked(best, picked) ? entry : best,
    );
    picked.push(farthest);
    rest.splice(rest.indexOf(farthest), 1);
  }
  return picked.map(({ color }) => color);
};
