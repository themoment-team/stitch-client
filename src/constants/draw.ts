export const DRAW_TIME_LIMIT = 300;

/** 남은 시간이 이만큼(초) 되면 알림 모달을 띄움 */
export const DRAW_TIME_WARNING = 60;

/** 남은 시간 알림 모달이 저절로 닫히기까지의 시간(ms) */
export const DRAW_TIME_WARNING_MODAL_MS = 3000;

export const HISTORY_LIMIT = 50;

export const DRAFT_KEYWORD_MAX_LENGTH = 50;

/** AI가 새로 그리는 도안 생성 횟수 (미리 그려 둔 도안은 제외) */
export const AI_DRAFT_LIMIT = 2;

/** 도안에서 뽑아 팔레트 아래에 보여줄 색의 최대 개수 (팔레트와 같은 6칸씩 두 줄) */
export const GUIDE_COLOR_LIMIT = 12;

export const PALETTE = [
  "#222222",
  "#8a8a8a",
  "#ffffff",
  "#ff5a5f",
  "#ff9f43",
  "#ffd93d",
  "#6bcb77",
  "#4d96ff",
  "#6c5ce7",
  "#f78fb3",
  "#8d5524",
];
