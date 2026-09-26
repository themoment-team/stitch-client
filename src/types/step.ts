export const STEP = {
  START: "START",
  DRAW: "DRAW",
} as const;

export type Step = (typeof STEP)[keyof typeof STEP];
