/**
 * API 하루 요청 한도 (서버에서 적용, 한국 시간 자정에 초기화)
 * - perIP: 한 곳에서 반복 호출해 전체 한도를 독차지하지 못하도록 IP별로 제한
 *   부스처럼 여러 사람이 같은 와이파이를 쓰면 모두 같은 IP로 잡히므로, AI는 전체의 절반까지 허용
 * - total: 최악의 경우에도 하루 비용이 정해진 만큼만 나가도록 전체를 제한
 */
export const RATE_LIMIT = {
  /** AI 이미지 생성(도안·다듬기 합산). 1회당 약 15원. 이용자 한 명의 횟수는 세션별로 따로 제한 */
  ai: { perIP: 150, total: 300 },
  /** 최종 그림 DB 저장 */
  drawings: { perIP: 50, total: 1000 },
} as const;

export type RateLimitScope = keyof typeof RATE_LIMIT;
