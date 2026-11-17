import { useState } from "react";
import { DEFAULT_LABEL_LAYOUT, LABEL_LAYOUT_STORAGE_KEY } from "@/constants";
import type { LabelLayout } from "@/types";

const isLabelLayout = (value: unknown): value is LabelLayout => {
  if (typeof value !== "object" || value === null) return false;
  return (Object.keys(DEFAULT_LABEL_LAYOUT) as (keyof LabelLayout)[]).every((key) => {
    const field = (value as Record<string, unknown>)[key];
    return typeof field === "number" && Number.isFinite(field) && field >= 0;
  });
};

const readStoredLayout = (): LabelLayout => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LABEL_LAYOUT_STORAGE_KEY) ?? "null");
    return isLabelLayout(stored) ? stored : DEFAULT_LABEL_LAYOUT;
  } catch {
    return DEFAULT_LABEL_LAYOUT;
  }
};

/** 라벨 인쇄 위치. 출력 화면에서 맞춘 값은 그 기기에 남아 다음 사람이 인쇄할 때도 그대로 쓰임 */
export const useLabelLayout = () => {
  // 출력 화면은 단계를 넘어와야 그려지므로 처음 그릴 때부터 브라우저 저장소를 읽을 수 있음
  const [layout, setLayout] = useState(readStoredLayout);

  const updateLayout = (next: LabelLayout) => {
    setLayout(next);
    try {
      window.localStorage.setItem(LABEL_LAYOUT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 저장소를 쓸 수 없으면 이번 화면에서만 적용
    }
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LABEL_LAYOUT);
    try {
      window.localStorage.removeItem(LABEL_LAYOUT_STORAGE_KEY);
    } catch {
      // 저장소를 쓸 수 없으면 이번 화면에서만 적용
    }
  };

  return { layout, updateLayout, resetLayout };
};
