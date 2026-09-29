import { DRAFT_LIBRARY } from "@/constants";
import { GRID_SIZE, type DraftTemplate, type GridSize, type Pixels } from "@/types";

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
 * 32×32 캔버스는 세밀하게 그린 rows32가 있으면 그대로 쓰고, 없으면 16×16 도안을 2배로 키움
 */
export const templateToPixels = ({ palette, rows, rows32 }: DraftTemplate, size: GridSize): Pixels => {
  const source = size === GRID_SIZE.LARGE && rows32 ? rows32 : rows;
  const scale = size / source.length;

  return Array.from({ length: size * size }, (_, index) => {
    const x = Math.floor((index % size) / scale);
    const y = Math.floor(Math.floor(index / size) / scale);
    return palette[source[y][x]] ?? null;
  });
};
