import { DRAW_TIME_LIMIT } from "./draw";

/** 그림을 만드는 진행 단계. 시작 화면의 단계 안내와 각 화면의 단계 표시에 함께 씀 */
export const STEPS = [
  {
    title: "그리기",
    description: `${DRAW_TIME_LIMIT / 60}분 동안 픽셀 그림을 그려요.`,
  },
  {
    title: "AI 다듬기",
    description: "원하면 AI가 그림을 깔끔하게 다듬어줘요.",
  },
  {
    title: "출력",
    description: "스티커로 인쇄하고, QR 코드로 그림을 저장해요.",
  },
] as const;
