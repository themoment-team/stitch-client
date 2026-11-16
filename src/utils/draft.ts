import { DRAFT_LIBRARY } from "@/constants";
import type { DraftTemplate, GridSize, Pixels } from "@/types";

// 띄어쓰기와 대소문자만 무시 ("Ice Cream" = "icecream")
const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, "");

const TEMPLATES_BY_LABEL = new Map(
  DRAFT_LIBRARY.flatMap((template) =>
    [template.name, ...template.aliases].map((label) => [normalize(label), template] as const),
  ),
);

/**
 * 키워드가 도안 이름이나 별칭과 정확히 같을 때만 그 도안
 * "웃는 고양이"처럼 다른 말이 붙으면 준비된 도안 대신 AI가 키워드대로 그림
 */
export const findDraftByKeyword = (keyword: string): DraftTemplate | null =>
  TEMPLATES_BY_LABEL.get(normalize(keyword)) ?? null;

/**
 * 도안을 캔버스 크기의 픽셀로 변환
 * 도안은 16·32칸으로 그려 두었으므로 정수 배율로만 키우고 남는 칸은 여백으로 두어 가운데에 놓음 (칸이 찌그러지지 않음)
 * 캔버스를 더 많이 채우는 쪽을 고르고, 같으면 세밀하게 그린 rows32를 씀
 * (예: 40칸은 rows32 그대로, 60칸은 rows를 3배, 64칸은 rows32를 2배)
 */
export const templateToPixels = ({ palette, rows, rows32 }: DraftTemplate, size: GridSize): Pixels => {
  const coverage = (source: string[]) => source.length * Math.floor(size / source.length);
  const source = rows32 && coverage(rows32) >= coverage(rows) ? rows32 : rows;
  const scale = Math.floor(size / source.length);
  const offset = Math.floor((size - source.length * scale) / 2);

  return Array.from({ length: size * size }, (_, index) => {
    const x = Math.floor(((index % size) - offset) / scale);
    const y = Math.floor((Math.floor(index / size) - offset) / scale);
    if (x < 0 || y < 0 || x >= source.length || y >= source.length) return null;
    return palette[source[y][x]] ?? null;
  });
};
