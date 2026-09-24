export const STEP = {
  START: "START",
} as const;

export type Step = (typeof STEP)[keyof typeof STEP];
