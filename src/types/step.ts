export const STEP = {
  START: "START",
  SIZE: "SIZE",
  DRAW: "DRAW",
  CONVERT: "CONVERT",
  PRINT: "PRINT",
} as const;

export type Step = (typeof STEP)[keyof typeof STEP];
