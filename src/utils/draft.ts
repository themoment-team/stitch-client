import { DRAFT_LIBRARY } from "@/constants";
import type { DraftTemplate, GridSize, Pixels } from "@/types";

const TEMPLATE_SIZE = 16;

const normalize = (text: string) => text.trim().toLowerCase();

// 긴 이름부터 비교해야 "개구리"가 별칭 "개"(강아지)보다 먼저 잡힘
const LABELS = DRAFT_LIBRARY.flatMap((template) =>
  [template.name, ...template.aliases].map((label) => ({ template, label: normalize(label) })),
).sort((a, b) => b.label.length - a.label.length);

/**
 * 한 글자 이름(달, 해)과 영어 별칭(cat, star)은 "달팽이", "location"처럼
 * 다른 단어 안에 걸리지 않도록 띄어쓴 단어 단위로만 매칭
 */
const needsWholeWord = (label: string) => label.length === 1 || /^[a-z0-9 ]+$/.test(label);

/** 키워드에 도안 이름이나 별칭이 들어 있으면 그 도안 (예: "웃는 고양이" → 고양이) */
export const findDraftByKeyword = (keyword: string): DraftTemplate | null => {
  const text = normalize(keyword).replace(/\s+/g, " ");
  const spaced = ` ${text} `;
  const compact = text.replace(/ /g, "");

  const match = LABELS.find(({ label }) =>
    needsWholeWord(label) ? spaced.includes(` ${label} `) : compact.includes(label.replace(/ /g, "")),
  );
  return match?.template ?? null;
};

/** 16×16 도안을 캔버스 크기에 맞게 키워 픽셀로 변환 */
export const templateToPixels = ({ palette, rows }: DraftTemplate, size: GridSize): Pixels => {
  const scale = size / TEMPLATE_SIZE;

  return Array.from({ length: size * size }, (_, index) => {
    const x = Math.floor((index % size) / scale);
    const y = Math.floor(Math.floor(index / size) / scale);
    return palette[rows[y][x]] ?? null;
  });
};
