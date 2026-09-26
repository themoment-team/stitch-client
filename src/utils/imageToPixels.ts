import type { GridSize, Pixels } from "@/types";

/** 한 칸을 몇 배로 크게 그려 칸 안의 대표 색을 고를지 */
const SAMPLE_SCALE = 8;
/** 칸에서 불투명한 부분이 이 비율 이상이어야 칠해진 칸으로 봄 */
const OPAQUE_RATIO = 0.4;
/**
 * 칸에서 어두운 색이 이 비율 이상이면 테두리로 보고 어두운 색을 씀
 * 32×32는 칸이 작아 테두리가 잘 살아남으므로 덜 적극적으로 적용
 */
const OUTLINE_RATIO: Record<GridSize, number> = { 16: 0.3, 32: 0.45 };
const DARK_LUMINANCE = 80;

interface ColorBucket {
  count: number;
  r: number;
  g: number;
  b: number;
}

const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");

const luminance = ({ count, r, g, b }: ColorBucket) => (0.299 * r + 0.587 * g + 0.114 * b) / count;

const mostCommon = (buckets: ColorBucket[]) =>
  buckets.reduce((best, bucket) => (bucket.count > best.count ? bucket : best));

const loadImage = async (src: string) => {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
};

/**
 * AI가 그린 이미지를 size × size 픽셀 그리드로 변환
 * 칸마다 가장 많이 쓰인 색을 골라 번진 색 없이 선명하게 만들고,
 * 얇은 테두리가 안쪽 색에 묻혀 사라지지 않도록 어두운 색이 충분하면 테두리 색을 우선함
 */
export const imageToPixels = async (src: string, size: GridSize): Promise<Pixels> => {
  const renderSize = size * SAMPLE_SCALE;
  const image = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = renderSize;
  canvas.height = renderSize;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("캔버스를 사용할 수 없습니다.");

  context.drawImage(image, 0, 0, renderSize, renderSize);
  const { data } = context.getImageData(0, 0, renderSize, renderSize);

  const pixels: Pixels = [];
  for (let cellY = 0; cellY < size; cellY++) {
    for (let cellX = 0; cellX < size; cellX++) {
      const buckets = new Map<number, ColorBucket>();
      let opaqueCount = 0;

      for (let y = 0; y < SAMPLE_SCALE; y++) {
        for (let x = 0; x < SAMPLE_SCALE; x++) {
          const offset = ((cellY * SAMPLE_SCALE + y) * renderSize + cellX * SAMPLE_SCALE + x) * 4;
          const [r, g, b, a] = data.subarray(offset, offset + 4);
          if (a < 128) continue;

          opaqueCount++;
          // 비슷한 색끼리 묶기 위해 채널별 상위 4비트로 분류
          const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
          const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
          bucket.count++;
          bucket.r += r;
          bucket.g += g;
          bucket.b += b;
          buckets.set(key, bucket);
        }
      }

      if (opaqueCount < SAMPLE_SCALE * SAMPLE_SCALE * OPAQUE_RATIO) {
        pixels.push(null);
        continue;
      }

      const allBuckets = [...buckets.values()];
      const darkBuckets = allBuckets.filter((bucket) => luminance(bucket) < DARK_LUMINANCE);
      const darkCount = darkBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
      const chosen =
        darkCount >= opaqueCount * OUTLINE_RATIO[size] ? mostCommon(darkBuckets) : mostCommon(allBuckets);

      const { count, r, g, b } = chosen;
      pixels.push(`#${toHex(r / count)}${toHex(g / count)}${toHex(b / count)}`);
    }
  }

  return pixels;
};
