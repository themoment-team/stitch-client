import { STEP, type Step } from "@/types";
import { DRAW_TIME_LIMIT } from "./draw";

/**
 * 그림을 만드는 진행 단계. 시작 화면의 단계 안내와 각 화면의 단계 표시에 함께 씀
 * 배열 순서가 곧 단계 번호이므로, 단계를 추가하거나 순서를 바꿀 때는 여기만 고치면 됨
 */
export const STEPS = [
  {
    step: STEP.SIZE,
    title: "크기 고르기",
    description: "캔버스 크기를 고르고 선을 그어 미리 써봐요.",
  },
  {
    step: STEP.DRAW,
    title: "그리기",
    description: `${DRAW_TIME_LIMIT / 60}분 동안 픽셀 그림을 그려요.`,
  },
  {
    step: STEP.CONVERT,
    title: "AI 다듬기",
    description: "원하면 AI가 그림을 깔끔하게 다듬어줘요.",
  },
  {
    step: STEP.PRINT,
    title: "출력",
    description: "스티커로 인쇄하고, QR 코드로 그림을 저장해요.",
  },
] as const;

/** 단계 표시에 쓰는 1부터 시작하는 번호 (STEPS의 순서) */
export const getStepNumber = (step: Step) => STEPS.findIndex((item) => item.step === step) + 1;
