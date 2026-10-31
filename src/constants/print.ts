import type { LabelLayout } from "@/types";

/** A4 용지 크기 (mm) */
export const PAPER_SIZE = { width: 210, height: 297 } as const;

/**
 * A4 한 장에 찍을 스티커 배치 (mm)
 * 26mm 스티커를 4열 × 5행(20개)으로 놓고, 오려 쓰기 편하도록 스티커 사이를 넉넉히 띄움
 * 열은 짝수, 줄은 홀수여야 가운데 두 열 사이와 가운데 줄을 기준으로 펼칠 수 있음
 */
export const LABEL_SHEET = {
  columns: 4,
  rows: 5,
  labelWidth: 26,
  labelHeight: 26,
} as const;

/**
 * 실제 인쇄물에 맞춰 보정한 기본 위치
 * 2·3번째 열과 3번째 줄을 기준으로 간격을 맞춤 (좌우 여백 26.5mm·29.5mm, 위아래 여백 32.5mm·36.5mm)
 * 프린터마다 밀리는 정도가 달라, 출력 화면 주소에 ?calibrate를 붙여 들어가면 직접 맞출 수 있음
 */
export const DEFAULT_LABEL_LAYOUT: LabelLayout = {
  centerX: 103.5,
  centerY: 146.5,
  centerColumnGap: 18,
  columnGap: 16,
  rowGap: 24.5,
};

/** 출력 화면에서 맞춘 위치를 그 기기에 저장해 두는 키 */
export const LABEL_LAYOUT_STORAGE_KEY = "stitch:label-layout";

/** 위치 조정 버튼 한 번에 움직이는 거리 (mm) */
export const LABEL_LAYOUT_STEP = 0.5;

/** 스티커 한 칸에 들어갈 그림 크기 */
export const LABEL_DRAWING_SIZE = 26;

/** 다운로드 QR 칸에 들어갈 QR 크기 (아래 안내 문구 자리를 남김) */
export const LABEL_QR_SIZE = 15;
