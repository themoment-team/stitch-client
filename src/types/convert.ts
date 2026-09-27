import type { Pixels } from "./pixel";

/** 고른 그림: 내 그림 또는 AI가 다듬은 결과의 순번 */
export type ConvertChoice = "original" | number;

/** 이전으로 갔다 와도 비용을 들인 변환 결과가 사라지지 않도록 페이지에 보관하는 상태 */
export interface ConvertSnapshot {
  results: Pixels[];
  choice: ConvertChoice;
}
