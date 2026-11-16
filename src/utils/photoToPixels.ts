import type { GridSize, Pixels } from "@/types";
import { loadImage } from "./imageToPixels";

type RGB = [number, number, number];

/** 한 칸을 몇 배로 크게 그려 칸 안의 대표 색을 고를지 */
const SAMPLE_SCALE = 8;
/** 칸에서 불투명한 부분이 이 비율 이상이어야 칠해진 칸으로 봄 */
const OPAQUE_RATIO = 0.5;
/** 칸에서 가장 큰 색 묶음이 이 비율 이상이어야 그 색을 대표 색으로 씀 */
const DOMINANT_RATIO = 0.35;
/**
 * 크기별로 남길 색 수. 사진은 색이 수천 가지라 줄이지 않으면 도트 그림이 아니라 흐린 사진처럼 보임
 * 캔버스가 클수록 칸이 많아 명암을 더 담을 수 있으므로 색을 더 남김
 */
const getColorCount = (size: GridSize) => (size <= 20 ? 8 : size <= 40 ? 14 : 20);
const QUANTIZE_ITERATIONS = 8;
/** 대상이 이미지의 어디에 있는지 찾을 때 쓰는 격자 크기. 여백을 칸 단위보다 촘촘하게 잘라내도록 결과보다 크게 잡음 */
const LOCATE_SIZE = 96;
/**
 * 가장자리와 이어진 칸이 배경색과 이 거리 안이면 배경으로 보고 비움
 * 넉넉히 잡으면 흙바닥 위 동물처럼 배경과 비슷한 색의 대상까지 지워지므로, 거의 같은 색만 배경으로 봄
 */
const BACKGROUND_DISTANCE = 24;
/** 가장자리 칸 중 이 비율 이상이 비슷한 색이어야 단색 배경으로 봄 (풍경 사진처럼 배경이 복잡하면 지우지 않음) */
const BACKGROUND_EDGE_RATIO = 0.6;
/** 배경을 지운 뒤 남은 칸이 이보다 적으면 대상까지 배경으로 잘못 본 것이므로 지우지 않음 */
const MIN_SUBJECT_RATIO = 0.08;

const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");

/** 사람 눈에 가까운 색 거리 (빨강 비중을 평균 밝기에 따라 조정하는 redmean 근사) */
const colorDistance = ([r1, g1, b1]: RGB, [r2, g2, b2]: RGB) => {
  const meanRed = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((2 + meanRed / 256) * dr * dr + 4 * dg * dg + (2 + (255 - meanRed) / 256) * db * db) / 3;
};

const averageColor = (colors: RGB[]): RGB => {
  const sum = colors.reduce<RGB>((acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b], [0, 0, 0]);
  return [sum[0] / colors.length, sum[1] / colors.length, sum[2] / colors.length];
};

/**
 * 칸의 대표 색. 평균을 내면 경계가 흐린 중간색이 되므로 비슷한 색끼리 묶어 가장 큰 묶음을 씀
 * 다만 사진의 자갈·털처럼 자잘한 무늬는 어느 묶음도 크지 않아 우연히 고른 색이 점처럼 튀므로, 이때는 평균을 씀
 */
const dominantColor = (data: Uint8ClampedArray, offsets: number[]): RGB => {
  const buckets = new Map<number, RGB[]>();
  offsets.forEach((offset) => {
    const [r, g, b] = data.subarray(offset, offset + 3);
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? [];
    bucket.push([r, g, b]);
    buckets.set(key, bucket);
  });
  const groups = [...buckets.values()];
  const largest = groups.reduce((best, bucket) => (bucket.length > best.length ? bucket : best));
  return averageColor(largest.length >= offsets.length * DOMINANT_RATIO ? largest : groups.flat());
};

/** 원본 이미지에서 격자에 담을 영역 (원본 픽셀 단위) */
interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 이미지의 area 부분을 비율을 유지한 채 정사각형 격자 가운데에 맞추고 칸마다 대표 색을 고름
 * 이미지 바깥(위아래·양옆 여백)과 투명한 칸은 null
 */
const sampleCells = (image: HTMLImageElement, size: number, area: Area) => {
  const renderSize = size * SAMPLE_SCALE;
  const scale = Math.min(renderSize / area.width, renderSize / area.height);
  const drawWidth = area.width * scale;
  const drawHeight = area.height * scale;
  const left = (renderSize - drawWidth) / 2;
  const top = (renderSize - drawHeight) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = renderSize;
  canvas.height = renderSize;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("캔버스를 사용할 수 없습니다.");
  context.imageSmoothingQuality = "high";
  context.drawImage(image, area.x, area.y, area.width, area.height, left, top, drawWidth, drawHeight);
  const { data } = context.getImageData(0, 0, renderSize, renderSize);

  const cells: (RGB | null)[] = [];
  let hasTransparency = false;
  for (let cellY = 0; cellY < size; cellY++) {
    for (let cellX = 0; cellX < size; cellX++) {
      const offsets: number[] = [];
      for (let y = 0; y < SAMPLE_SCALE; y++) {
        for (let x = 0; x < SAMPLE_SCALE; x++) {
          const pixelX = cellX * SAMPLE_SCALE + x;
          const pixelY = cellY * SAMPLE_SCALE + y;
          const offset = (pixelY * renderSize + pixelX) * 4;
          if (data[offset + 3] >= 128) {
            offsets.push(offset);
            continue;
          }
          // 여백이 아닌 이미지 안쪽이 투명하면 이미 배경이 지워진 이미지(PNG 스티커 등)로 봄
          const isInsideImage =
            pixelX >= left + 1 && pixelX < left + drawWidth - 1 && pixelY >= top + 1 && pixelY < top + drawHeight - 1;
          if (isInsideImage) hasTransparency = true;
        }
      }
      cells.push(offsets.length >= SAMPLE_SCALE * SAMPLE_SCALE * OPAQUE_RATIO ? dominantColor(data, offsets) : null);
    }
  }

  /** 격자의 칸 좌표를 원본 이미지 좌표로 바꿈 */
  const toImagePoint = (cellX: number, cellY: number) => ({
    x: area.x + (cellX * SAMPLE_SCALE - left) / scale,
    y: area.y + (cellY * SAMPLE_SCALE - top) / scale,
  });

  return { cells, hasTransparency, toImagePoint };
};

const getNeighbors = (index: number, size: number) => {
  const x = index % size;
  const y = Math.floor(index / size);
  return [
    x > 0 ? index - 1 : -1,
    x < size - 1 ? index + 1 : -1,
    y > 0 ? index - size : -1,
    y < size - 1 ? index + size : -1,
  ].filter((next) => next >= 0);
};

/**
 * 가장자리에 넓게 깔린 비슷한 색을 배경으로 보고, 가장자리와 이어진 그 색 칸을 비움
 * 흰 배경 위 캐릭터처럼 대상만 남겨 스티커로 쓰기 좋게 함. 배경이 복잡하면 그대로 둠
 */
const removeBackground = (cells: (RGB | null)[], size: number) => {
  // 이미지의 바깥 테두리 칸 (격자 끝이거나 여백과 맞닿은 칸)
  const edges = cells.flatMap((color, index) => {
    if (!color) return [];
    const neighbors = getNeighbors(index, size);
    const isEdge = neighbors.length < 4 || neighbors.some((next) => cells[next] === null);
    return isEdge ? [index] : [];
  });
  if (edges.length === 0) return cells;

  // 가장 많은 테두리 칸과 비슷한 색을 배경 후보로 고름
  const supporters = edges
    .map((index) =>
      edges.filter((other) => colorDistance(cells[index]!, cells[other]!) <= BACKGROUND_DISTANCE),
    )
    .reduce((best, group) => (group.length > best.length ? group : best));
  if (supporters.length < edges.length * BACKGROUND_EDGE_RATIO) return cells;

  const background = averageColor(supporters.map((index) => cells[index]!));
  const removed = new Set(supporters);
  const queue = [...supporters];
  for (let i = 0; i < queue.length; i++) {
    getNeighbors(queue[i], size).forEach((next) => {
      const color = cells[next];
      if (!color || removed.has(next) || colorDistance(color, background) > BACKGROUND_DISTANCE) return;
      removed.add(next);
      queue.push(next);
    });
  }

  const remaining = cells.filter((color, index) => color && !removed.has(index)).length;
  if (remaining < cells.length * MIN_SUBJECT_RATIO) return cells;
  return cells.map((color, index) => (removed.has(index) ? null : color));
};

/**
 * 색을 count개로 줄임 (k-평균 군집)
 * 처음 대표 색은 지금까지 고른 색과 가장 먼 색을 차례로 골라, 눈·볼처럼 작지만 눈에 띄는 색이 다른 색에 묻히지 않게 함
 */
const quantize = (colors: RGB[], count: number): RGB[] => {
  if (colors.length === 0) return [];
  const centers: RGB[] = [averageColor(colors)];
  while (centers.length < count) {
    let farthest = colors[0];
    let farthestDistance = -1;
    colors.forEach((color) => {
      const distance = Math.min(...centers.map((center) => colorDistance(color, center)));
      if (distance > farthestDistance) {
        farthest = color;
        farthestDistance = distance;
      }
    });
    // 남은 색이 모두 이미 고른 색과 같으면 더 나눌 필요가 없음
    if (farthestDistance === 0) break;
    centers.push(farthest);
  }

  const nearest = (color: RGB) =>
    centers.reduce((best, center, index) =>
      colorDistance(color, center) < colorDistance(color, centers[best]) ? index : best,
    0);

  for (let iteration = 0; iteration < QUANTIZE_ITERATIONS; iteration++) {
    const groups = centers.map<RGB[]>(() => []);
    colors.forEach((color) => groups[nearest(color)].push(color));
    groups.forEach((group, index) => {
      if (group.length > 0) centers[index] = averageColor(group);
    });
  }

  return colors.map((color) => centers[nearest(color)]);
};

/** 배경을 비운 뒤 남는 칸들(대상)을 찾아 원본 이미지에서의 영역으로 돌려줌. 대상을 못 찾으면 이미지 전체 */
const findSubjectArea = (image: HTMLImageElement): Area => {
  const { naturalWidth: width, naturalHeight: height } = image;
  const whole = { x: 0, y: 0, width, height };
  const sampled = sampleCells(image, LOCATE_SIZE, whole);
  const cells = sampled.hasTransparency ? sampled.cells : removeBackground(sampled.cells, LOCATE_SIZE);

  const filled = cells.flatMap((color, index) =>
    color ? [{ x: index % LOCATE_SIZE, y: Math.floor(index / LOCATE_SIZE) }] : [],
  );
  if (filled.length === 0) return whole;

  // 경계 칸이 잘리지 않도록 한 칸씩 여유를 둠
  const start = sampled.toImagePoint(
    Math.min(...filled.map(({ x }) => x)) - 1,
    Math.min(...filled.map(({ y }) => y)) - 1,
  );
  const end = sampled.toImagePoint(
    Math.max(...filled.map(({ x }) => x)) + 2,
    Math.max(...filled.map(({ y }) => y)) + 2,
  );
  const x = Math.max(0, start.x);
  const y = Math.max(0, start.y);
  return { x, y, width: Math.min(width, end.x) - x, height: Math.min(height, end.y) - y };
};

/**
 * 사용자가 고른 사진·그림을 size × size 도트 그림으로 변환
 * AI 결과와 달리 배경이 꽉 차 있고 색이 많으므로, 배경을 비우고 색 수를 줄여 도트 그림처럼 만듦
 * 검색 이미지는 대상 주변 여백이 넓은 경우가 많아, 먼저 대상을 찾아 그 부분만 격자에 꽉 차게 담음
 */
export const photoToPixels = async (src: string, size: GridSize): Promise<Pixels> => {
  const image = await loadImage(src);
  if (!image.naturalWidth || !image.naturalHeight) throw new Error("이미지 크기를 알 수 없습니다.");

  const sampled = sampleCells(image, size, findSubjectArea(image));
  const cells = sampled.hasTransparency ? sampled.cells : removeBackground(sampled.cells, size);

  const filled = cells.flatMap((color, index) => (color ? [index] : []));
  const quantized = quantize(
    filled.map((index) => cells[index]!),
    getColorCount(size),
  );

  const pixels: Pixels = Array(cells.length).fill(null);
  filled.forEach((index, order) => {
    const [r, g, b] = quantized[order];
    pixels[index] = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  });
  return pixels;
};
