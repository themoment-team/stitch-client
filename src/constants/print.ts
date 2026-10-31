import type { LabelLayout } from "@/types";

/** A4 용지 크기 (mm) */
export const PAPER_SIZE = { width: 210, height: 297 } as const;

/**
 * A4 한 장에 찍을 스티커 배치 (mm)
 * 26mm 스티커를 4열 × 5행(20개)으로 놓음
 * 열은 짝수, 줄은 홀수여야 가운데 두 열 사이와 가운데 줄을 기준으로 펼칠 수 있음
 */
export const LABEL_SHEET = {
  columns: 4,
  rows: 5,
  labelWidth: 26,
  labelHeight: 26,
} as const;

/**
 * 라벨지 규격 (mm). 지름 48mm 원형 라벨이 4열 × 5행으로 용지 한가운데에 놓여 있음
 * 원 사이 간격은 가로 2.5mm, 세로는 실제 인쇄물에 맞춰 4.5mm
 */
const LABEL_PAPER = { diameter: 48, columnGap: 2.5, rowGap: 4.5 } as const;

/** 원 하나의 중심에서 옆·아래 원의 중심까지 */
const LABEL_PITCH = {
  x: LABEL_PAPER.diameter + LABEL_PAPER.columnGap,
  y: LABEL_PAPER.diameter + LABEL_PAPER.rowGap,
} as const;

/** 이 프린터가 전체를 오른쪽·아래로 밀어 찍는 거리. 그만큼 반대로 옮겨 찍음 */
const PRINTER_OFFSET = { x: 2, y: 2 } as const;

/**
 * 기본 위치. 스티커 그림이 라벨지 원마다 정가운데에 오도록 원 중심 간격에 맞춤
 * 프린터마다 밀리는 정도가 달라, 출력 화면 주소에 ?calibrate를 붙여 들어가면 직접 맞출 수 있음
 */
export const DEFAULT_LABEL_LAYOUT: LabelLayout = {
  centerX: PAPER_SIZE.width / 2 - PRINTER_OFFSET.x,
  centerY: PAPER_SIZE.height / 2 - PRINTER_OFFSET.y,
  centerColumnGap: LABEL_PITCH.x - LABEL_SHEET.labelWidth,
  columnGap: LABEL_PITCH.x - LABEL_SHEET.labelWidth,
  rowGap: LABEL_PITCH.y - LABEL_SHEET.labelHeight,
};

/** 출력 화면에서 맞춘 위치를 그 기기에 저장해 두는 키 */
export const LABEL_LAYOUT_STORAGE_KEY = "stitch:label-layout";

/** 위치 조정 버튼 한 번에 움직이는 거리 (mm) */
export const LABEL_LAYOUT_STEP = 0.5;

/** 스티커 한 칸에 들어갈 그림 크기 */
export const LABEL_DRAWING_SIZE = 26;

/** 다운로드 QR 칸에 들어갈 QR 크기 (아래 안내 문구 자리를 남김) */
export const LABEL_QR_SIZE = 15;
