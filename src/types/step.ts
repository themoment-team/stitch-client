export const STEP = {
  START: "START",
  DRAW: "DRAW",
  CONVERT: "CONVERT",
} as const;

export type Step = (typeof STEP)[keyof typeof STEP];
