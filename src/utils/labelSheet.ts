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
const getRowTop = ({ centerY, rowGap, outerRowGap }: LabelLayout, row: number) => {
  const half = (rows - 1) / 2;
  const distance = Math.abs(row - half);
  // 맨 위·맨 아래 줄까지는 마지막 한 칸만 바깥 줄 간격으로 벌어짐
  const gaps = distance >= half ? (distance - 1) * rowGap + outerRowGap : distance * rowGap;
  return centerY - labelHeight / 2 + Math.sign(row - half) * (distance * labelHeight + gaps);
};

/** 칸마다 스티커를 놓을 위치 (왼쪽 위부터 줄 순서) */
export const getLabelPositions = (layout: LabelLayout) =>
  Array.from({ length: columns * rows }, (_, index) => ({
    left: getColumnLeft(layout, index % columns),
    top: getRowTop(layout, Math.floor(index / columns)),
  }));
