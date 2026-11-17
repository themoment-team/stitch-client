export type RGB = [number, number, number];

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

/** "#rrggbb"를 RGB로 바꿈. 형식이 다르면 null (다른 색으로 취급하도록 호출하는 쪽에서 처리) */
export const hexToRgb = (hex: string): RGB | null => {
  if (!HEX_COLOR_PATTERN.test(hex)) return null;
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as RGB;
};

/**
 * 사람 눈에 가까운 색 거리 (빨강 비중을 평균 밝기에 따라 조정하는 redmean 근사)
 * 3으로 나눠 RGB 직선 거리와 비슷한 크기로 맞춤. 비슷한 색을 판단하는 곳은 모두 이 거리를 씀
 */
export const colorDistance = ([r1, g1, b1]: RGB, [r2, g2, b2]: RGB) => {
  const meanRed = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((2 + meanRed / 256) * dr * dr + 4 * dg * dg + (2 + (255 - meanRed) / 256) * db * db) / 3;
};
