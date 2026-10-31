import { LABEL_SHEET } from "@/constants";
import type { LabelLayout } from "@/types";

const { columns, rows, labelWidth, labelHeight } = LABEL_SHEET;

/** 용지 왼쪽 끝에서 column번째 열(0부터) 스티커 왼쪽 끝까지 (mm) */
const getColumnLeft = ({ centerX, centerColumnGap, columnGap }: LabelLayout, column: number) => {
  const half = columns / 2;
  if (column >= half) return centerX + centerColumnGap / 2 + (column - half) * (labelWidth + columnGap);
  return centerX - centerColumnGap / 2 - (half - column) * labelWidth - (half - 1 - column) * columnGap;
};

/** 용지 위쪽 끝에서 row번째 줄(0부터) 스티커 위쪽 끝까지 (mm) */
const getRowTop = ({ centerY, rowGap }: LabelLayout, row: number) =>
  centerY - labelHeight / 2 + (row - (rows - 1) / 2) * (labelHeight + rowGap);

/** 칸마다 스티커를 놓을 위치 (왼쪽 위부터 줄 순서) */
export const getLabelPositions = (layout: LabelLayout) =>
  Array.from({ length: columns * rows }, (_, index) => ({
    left: getColumnLeft(layout, index % columns),
    top: getRowTop(layout, Math.floor(index / columns)),
  }));
