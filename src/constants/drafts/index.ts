import type { DraftTemplate } from "@/types";
import { ANIMAL_DRAFTS } from "./animals";
import { CHARACTER_DRAFTS } from "./characters";
import { FOOD_DRAFTS } from "./food";
import { NATURE_DRAFTS } from "./nature";
import { OBJECT_DRAFTS } from "./objects";

/**
 * 미리 그려 둔 도안 라이브러리
 * rows(16×16)의 각 글자는 palette의 색, "."은 빈 칸
 * 32×32 캔버스에서는 rows32가 있으면 그대로, 없으면 rows를 2배로 키워 사용
 */
export const DRAFT_LIBRARY: DraftTemplate[] = [
  ...ANIMAL_DRAFTS,
  ...FOOD_DRAFTS,
  ...NATURE_DRAFTS,
  ...CHARACTER_DRAFTS,
  ...OBJECT_DRAFTS,
];
